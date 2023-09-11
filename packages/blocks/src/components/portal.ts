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
  @property({ attribute: false })
  public container = document.body;

  @property({ attribute: false })
  public template = html``;

  private _portalRoot: HTMLElement | null = null;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._portalRoot?.remove();
  }

  override createRenderRoot() {
    const portalRoot = document.createElement('div');
    portalRoot.classList.add('blocksuite-portal');
    this.container.append(portalRoot);
    this._portalRoot = portalRoot;
    return portalRoot;
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
  shadowDom?: boolean;
  renderOptions?: RenderOptions;
  /**
   * Defaults to `true`.
   * If true, the portalRoot will be added a class `blocksuite-portal`. It's useful for finding the portalRoot.
   */
  identifyWrapper?: boolean;
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
    portalRoot.attachShadow({ mode: 'open' });
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

type AdvancedPortalOptions = Omit<PortalOptions, 'template' | 'signal'> & {
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
  computePosition?: {
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
  /**
   * Whether to close the portal when click away(click outside).
   * @default false
   */
  closeOnClickAway?: boolean;
};

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
  computePosition: computePositionOptions,
  abortController,
  closeOnClickAway = false,
  ...portalOptions
}: AdvancedPortalOptions) {
  const positionSlot = new Slot<ComputePositionReturn>();
  const template = portalOptions.template;
  const templateWithPosition =
    template instanceof Function
      ? ({ updatePortal }: { updatePortal: () => void }) =>
          template({ updatePortal, positionSlot })
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

  if (!computePositionOptions) {
    return portalRoot;
  }

  const display = portalRoot.style.display;
  portalRoot.style.display = 'none';
  portalRoot.style.position = 'fixed';
  portalRoot.style.left = '0';
  portalRoot.style.top = '0';
  const { referenceElement, ...options } = computePositionOptions;
  const maybeAutoUpdateOptions = computePositionOptions.autoUpdate ?? {};
  const update = () => {
    if (
      computePositionOptions.abortWhenRefRemoved !== false &&
      referenceElement instanceof Element &&
      !referenceElement.isConnected
    ) {
      abortController.abort();
    }
    computePosition(referenceElement, portalRoot, options).then(
      positionReturn => {
        const { x, y } = positionReturn;
        // Use transform maybe cause overlay-mask offset issue
        // portalRoot.style.transform = `translate(${x}px, ${y}px)`;
        portalRoot.style.left = `${x}px`;
        portalRoot.style.top = `${y}px`;
        portalRoot.style.display = display;
        positionSlot.emit(positionReturn);
      }
    );
  };
  if (!maybeAutoUpdateOptions) {
    update();
  } else {
    const autoUpdateOptions =
      maybeAutoUpdateOptions === true ? {} : maybeAutoUpdateOptions;
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
