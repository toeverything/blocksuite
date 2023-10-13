import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { StyleInfo } from 'lit/directives/style-map.js';

import type { AdvancedPortalOptions } from './portal.js';
import { createLitPortal } from './portal.js';

type OptionsParams = Omit<
  ReturnType<typeof whenHover>,
  'setFloating' | 'dispose'
> & {
  abortController: AbortController;
};
type HoverPortalOptions = Omit<AdvancedPortalOptions, 'abortController'>;

type HoverOptions = {
  /**
   * Transition style when the portal is shown or hidden.
   */
  transition: {
    in: StyleInfo;
    out: StyleInfo;
  } | null;
  /**
   * Set the portal as hover element automatically.
   * @default true
   */
  setPortalAsFloating: boolean;
} & WhenHoverOptions;

const DEFAULT_HOVER_OPTIONS: HoverOptions = {
  transition: {
    in: {
      opacity: '1',
      transition: 'opacity 0.1s ease-in-out',
    },
    out: {
      opacity: '0',
      transition: 'opacity 0.1s ease-in-out',
    },
  },
  setPortalAsFloating: true,
};

type WhenHoverOptions = {
  leaveDelay?: number;
  /**
   * When already hovered to the reference element,
   * but the floating element is not ready,
   * the callback will still be executed if the `alwayRunWhenNoFloating` is true.
   *
   * It is useful when the floating element is removed just before by a user's action,
   * and the user's mouse is still hovering over the reference element.
   *
   * @default true
   */
  alwayRunWhenNoFloating?: boolean;
};

/**
 * Call the `whenHoverChange` callback when the element is hovered.
 *
 * After the mouse leaves the element, there is a 300ms delay by default.
 *
 * Note: The callback may be called multiple times when the mouse is hovering or hovering out.
 *
 * See also https://floating-ui.com/docs/useHover
 *
 * @example
 * ```ts
 * private _setReference: RefOrCallback;
 *
 * connectedCallback() {
 *   let hoverTip: HTMLElement | null = null;
 *   const { setReference, setFloating } = whenHover(isHover => {
 *     if (!isHover) {
 *       hoverTips?.remove();
 *       return;
 *     }
 *     hoverTip = document.createElement('div');
 *     document.body.append(hoverTip);
 *     setFloating(hoverTip);
 *   }, { hoverDelay: 500 });
 *   this._setReference = setReference;
 * }
 *
 * render() {
 *   return html`
 *     <div ref=${this._setReference}></div>
 *   `;
 * }
 * ```
 */
function whenHover(
  whenHoverChange: (isHover: boolean, event?: Event) => void,
  { leaveDelay = 300, alwayRunWhenNoFloating = true }: WhenHoverOptions = {}
) {
  /**
   * The event listener will be removed when the signal is aborted.
   */
  const abortController = new AbortController();
  let hoverState = false;
  let hoverTimeout = 0;
  let referenceElement: Element | undefined;
  let floatingElement: Element | undefined;

  const onHover = (e: Event) => {
    clearTimeout(hoverTimeout);
    if (!hoverState) {
      hoverState = true;
      whenHoverChange(true, e);
      return;
    }
    // Already hovered
    if (
      alwayRunWhenNoFloating &&
      (!floatingElement || !floatingElement.isConnected)
    ) {
      // But the floating element is not ready
      // so we need to run the callback still
      whenHoverChange(true, e);
    }
  };

  const onHoverLeave = (e: Event) => {
    clearTimeout(hoverTimeout);
    hoverTimeout = window.setTimeout(() => {
      hoverState = false;
      whenHoverChange(false, e);
    }, leaveDelay);
  };

  const addHoverListener = (element?: Element) => {
    if (!element) return;
    // see https://stackoverflow.com/questions/14795099/pure-javascript-to-check-if-something-has-hover-without-setting-on-mouseover-ou
    const alreadyHover = element.matches(':hover');
    if (alreadyHover && !abortController.signal.aborted) {
      // When the element is already hovered, we need to trigger the callback manually
      onHover(new MouseEvent('mouseover'));
    }
    element.addEventListener('mouseover', onHover, {
      signal: abortController.signal,
    });
    element.addEventListener('mouseleave', onHoverLeave, {
      signal: abortController.signal,
    });
  };
  const removeHoverListener = (element?: Element) => {
    if (!element) return;
    element.removeEventListener('mouseover', onHover);
    element.removeEventListener('mouseleave', onHoverLeave);
  };

  const setReference = (element?: Element) => {
    // Clean previous listeners
    removeHoverListener(referenceElement);
    addHoverListener(element);
    referenceElement = element;
  };

  const setFloating = (element?: Element) => {
    // Clean previous listeners
    removeHoverListener(floatingElement);
    addHoverListener(element);
    floatingElement = element;
  };

  return {
    setReference,
    setFloating,
    dispose: () => {
      abortController.abort();
    },
  };
}

export class HoverController implements ReactiveController {
  protected _disposables = new DisposableGroup();
  host: ReactiveControllerHost;

  private _abortController?: AbortController;
  private _setReference?: (element?: Element | undefined) => void;
  private _portal?: HTMLDivElement;
  private readonly _onHover: (
    options: OptionsParams
  ) => HoverPortalOptions | null;
  private readonly _hoverOptions: HoverOptions;

  get setReference() {
    if (!this._setReference) {
      throw new Error('setReference is not ready');
    }
    return this._setReference;
  }

  get portal() {
    return this._portal;
  }

  constructor(
    host: ReactiveControllerHost,
    onHover: (options: OptionsParams) => HoverPortalOptions | null,
    hoverOptions?: Partial<HoverOptions>
  ) {
    (this.host = host).addController(this);
    this._onHover = onHover;
    this._hoverOptions = { ...DEFAULT_HOVER_OPTIONS, ...hoverOptions };
  }

  hostConnected() {
    if (this._disposables.disposed) {
      this._disposables = new DisposableGroup();
    }
    // Start a timer when the host is connected
    const { setReference, setFloating, dispose } = whenHover(isHover => {
      if (!isHover) {
        const abortController = this._abortController;
        if (!abortController) return;
        if (!this._portal || !this._hoverOptions.transition) {
          abortController.abort();
          return;
        }
        // Transition out
        Object.assign(this._portal.style, this._hoverOptions.transition.out);
        this._portal.addEventListener(
          'transitionend',
          () => {
            abortController.abort();
          },
          { signal: abortController.signal }
        );
        return;
      }
      if (this._abortController) return;
      this._abortController = new AbortController();
      this._abortController.signal.addEventListener('abort', () => {
        this._abortController = undefined;
      });
      const portalOptions = this._onHover({
        setReference,
        abortController: this._abortController,
      });
      if (!portalOptions) {
        this._abortController.abort();
        return;
      }
      this._portal = createLitPortal({
        ...portalOptions,
        abortController: this._abortController,
      });

      const transition = this._hoverOptions.transition;
      if (transition) {
        Object.assign(this._portal.style, transition.out);
        setTimeout(() => {
          assertExists(this._portal);
          Object.assign(this._portal.style, transition.in);
        });
      }

      if (this._hoverOptions.setPortalAsFloating) {
        setFloating(this._portal);
      }
    }, this._hoverOptions);
    this._setReference = setReference;
    this._disposables.add(dispose);
  }

  hostDisconnected() {
    this._abortController?.abort();
    this._disposables.dispose();
  }
}
