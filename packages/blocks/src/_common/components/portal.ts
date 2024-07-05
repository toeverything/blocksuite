import { assertExists, Slot } from '@blocksuite/global/utils';
import {
  autoUpdate,
  type AutoUpdateOptions,
  computePosition,
  type ComputePositionConfig,
  type ComputePositionReturn,
  type ReferenceElement,
} from '@floating-ui/dom';
import {
  html,
  LitElement,
  render,
  type RenderOptions,
  type TemplateResult,
} from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Renders a template into a portal. Defaults to `document.body`.
 *
 * Note that every time the parent component re-renders, the portal will be re-called.
 *
 * See https://lit.dev/docs/components/rendering/#writing-a-good-render()-method
 *
 * @example
 * ```ts
 * render() {
 *   return html`${showPortal
 *     ? html`<blocksuite-portal .template=${portalTemplate}></blocksuite-portal>`
 *     : null}`;
 * };
 * ```
 */
@customElement('blocksuite-portal')
export class Portal extends LitElement {
  private _portalRoot: HTMLElement | null = null;

  @property({ attribute: false })
  accessor container = document.body;

  @property({ attribute: false })
  accessor template = html``;

  @property({ attribute: false })
  accessor shadowDom: boolean | ShadowRootInit = true;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._portalRoot?.remove();
  }

  override createRenderRoot() {
    const portalRoot = document.createElement('div');
    const renderRoot = this.shadowDom
      ? portalRoot.attachShadow({
          mode: 'open',
          ...(typeof this.shadowDom !== 'boolean' ? this.shadowDom : {}),
        })
      : portalRoot;
    portalRoot.classList.add('blocksuite-portal');
    this.container.append(portalRoot);
    this._portalRoot = portalRoot;
    return renderRoot;
  }

  override render() {
    return this.template;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'blocksuite-portal': Portal;
  }
}

/**
 * See https://lit.dev/docs/templates/expressions/#child-expressions
 */
type Renderable =
  | TemplateResult<1>
  // Any DOM node can be passed to a child expression.
  | HTMLElement
  // Numbers values like 5 will render the string '5'. Bigints are treated similarly.
  | number
  // A boolean value true will render 'true', and false will render 'false', but rendering a boolean like this is uncommon.
  | boolean
  // The empty string '', null, and undefined are specially treated and render nothing.
  | string
  | null
  | undefined;

type PortalOptions = {
  template: Renderable | ((ctx: { updatePortal: () => void }) => Renderable);
  container?: Element;
  /**
   * The portal is removed when the AbortSignal is aborted.
   */
  signal?: AbortSignal;
  /**
   * Defaults to `true`.
   */
  shadowDom?: boolean | ShadowRootInit;
  renderOptions?: RenderOptions;
  /**
   * Defaults to `true`.
   * If true, the portalRoot will be added a class `blocksuite-portal`. It's useful for finding the portalRoot.
   */
  identifyWrapper?: boolean;

  portalStyles?: Record<string, string | number | undefined | null>;
};

/**
 * Similar to `<blocksuite-portal>`, but only renders once when called.
 *
 * The template should be a **static** template since it will not be re-rendered unless `updatePortal` is called.
 *
 * See {@link Portal} for more details.
 */
export function createSimplePortal({
  template,
  container = document.body,
  signal = new AbortController().signal,
  renderOptions,
  shadowDom = true,
  identifyWrapper = true,
}: PortalOptions) {
  const portalRoot = document.createElement('div');
  if (identifyWrapper) {
    portalRoot.classList.add('blocksuite-portal');
  }
  if (shadowDom) {
    portalRoot.attachShadow({
      mode: 'open',
      ...(typeof shadowDom !== 'boolean' ? shadowDom : {}),
    });
  }
  signal.addEventListener('abort', () => {
    portalRoot.remove();
  });

  const root = shadowDom ? portalRoot.shadowRoot : portalRoot;
  assertExists(root);

  let updateId = 0;
  const updatePortal: (id: number) => void = id => {
    if (id !== updateId) {
      console.warn(
        'Potentially infinite recursion! Please clean up the old event listeners before `updatePortal`'
      );
      return;
    }
    updateId++;
    const curId = updateId;
    const templateResult =
      template instanceof Function
        ? template({ updatePortal: () => updatePortal(curId) })
        : template;
    assertExists(templateResult);
    render(templateResult, root, renderOptions);
  };

  updatePortal(updateId);
  container.append(portalRoot);

  return portalRoot;
}

type ComputePositionOptions = {
  referenceElement: ReferenceElement;
  /**
   * Default `false`.
   */
  autoUpdate?: true | AutoUpdateOptions;
  /**
   * Default `true`. Only work when `referenceElement` is an `Element`. Check when position update (`autoUpdate` is `true` or first tick)
   */
  abortWhenRefRemoved?: boolean;
} & Partial<ComputePositionConfig>;

export type AdvancedPortalOptions = Omit<
  PortalOptions,
  'template' | 'signal'
> & {
  abortController: AbortController;
  template:
    | Renderable
    | ((context: {
        positionSlot: Slot<ComputePositionReturn>;
        updatePortal: () => void;
      }) => Renderable);
  /**
   * See https://floating-ui.com/docs/computePosition
   */
  computePosition?:
    | ComputePositionOptions
    | ((portalRoot: Element) => ComputePositionOptions);
  /**
   * Whether to close the portal when click away(click outside).
   * @default false
   */
  closeOnClickAway?: boolean;
};

/**
 * Where el is the DOM element you'd like to test for visibility
 */
function isElementVisible(el: Element) {
  // The API is not stable, so we need to check the existence of the function first
  // See also https://caniuse.com/?search=checkVisibility
  if (el.checkVisibility) {
    // See https://drafts.csswg.org/cssom-view-1/#dom-element-checkvisibility
    return el.checkVisibility();
  }
  // Fallback to the old way
  // Remove this when the `checkVisibility` API is stable
  if (!el.isConnected) return false;

  if (el instanceof HTMLElement) {
    // See https://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
    return !(el.offsetParent === null);
  }
  return true;
}

/**
 * Similar to `createSimplePortal`, but supports auto update position.
 *
 * The template should be a **static** template since it will not be re-rendered.
 *
 * See {@link createSimplePortal} for more details.
 *
 * @example
 * ```ts
 * createLitPortal({
 *   template: RenameModal({
 *     model,
 *     abortController: renameAbortController,
 *   }),
 *   computePosition: {
 *     referenceElement: anchor,
 *     placement: 'top-end',
 *     middleware: [flip(), offset(4)],
 *     autoUpdate: true,
 *   },
 *   abortController: renameAbortController,
 * });
 * ```
 */
export function createLitPortal({
  computePosition: positionConfigOrFn,
  abortController,
  closeOnClickAway = false,
  ...portalOptions
}: AdvancedPortalOptions) {
  let positionSlot = new Slot<ComputePositionReturn>();
  const template = portalOptions.template;
  const templateWithPosition =
    template instanceof Function
      ? ({ updatePortal }: { updatePortal: () => void }) => {
          // We need to create a new slot for each template, otherwise the slot may be used in the old template
          positionSlot = new Slot<ComputePositionReturn>();
          return template({ updatePortal, positionSlot });
        }
      : template;

  const portalRoot = createSimplePortal({
    ...portalOptions,
    signal: abortController.signal,
    template: templateWithPosition,
  });

  if (closeOnClickAway) {
    // Avoid triggering click away listener on initial render
    setTimeout(() =>
      document.addEventListener(
        'click',
        e => {
          if (portalRoot.contains(e.target as Node)) return;
          abortController.abort();
        },
        {
          signal: abortController.signal,
        }
      )
    );
  }

  if (!positionConfigOrFn) {
    return portalRoot;
  }

  const visibility = portalRoot.style.visibility;
  portalRoot.style.visibility = 'hidden';
  portalRoot.style.position = 'fixed';
  portalRoot.style.left = '0';
  portalRoot.style.top = '0';

  Object.assign(portalRoot.style, portalOptions.portalStyles);

  const computePositionOptions =
    positionConfigOrFn instanceof Function
      ? positionConfigOrFn(portalRoot)
      : positionConfigOrFn;
  const { referenceElement, ...options } = computePositionOptions;
  assertExists(referenceElement, 'referenceElement is required');
  const update = () => {
    if (
      computePositionOptions.abortWhenRefRemoved !== false &&
      referenceElement instanceof Element &&
      !isElementVisible(referenceElement)
    ) {
      abortController.abort();
    }
    computePosition(referenceElement, portalRoot, options)
      .then(positionReturn => {
        const { x, y } = positionReturn;
        // Use transform maybe cause overlay-mask offset issue
        // portalRoot.style.transform = `translate(${x}px, ${y}px)`;
        portalRoot.style.left = `${x}px`;
        portalRoot.style.top = `${y}px`;
        if (portalRoot.style.visibility === 'hidden') {
          portalRoot.style.visibility = visibility;
        }
        positionSlot.emit(positionReturn);
      })
      .catch(console.error);
  };
  if (!computePositionOptions.autoUpdate) {
    update();
  } else {
    const autoUpdateOptions =
      computePositionOptions.autoUpdate === true
        ? {}
        : computePositionOptions.autoUpdate;
    const cleanup = autoUpdate(
      referenceElement,
      portalRoot,
      update,
      autoUpdateOptions
    );
    abortController.signal.addEventListener('abort', () => {
      cleanup();
    });
  }

  return portalRoot;
}
