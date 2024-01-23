import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { StyleInfo } from 'lit/directives/style-map.js';

import type { AdvancedPortalOptions } from '../portal.js';
import { createLitPortal } from '../portal.js';
import { whenHover, type WhenHoverOptions } from './when-hover.js';

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
  allowMultiple?: boolean;
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
  allowMultiple: false,
};

export class HoverController implements ReactiveController {
  protected _disposables = new DisposableGroup();
  host: ReactiveControllerHost;

  static globalAbortController?: AbortController;

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
      if (this._abortController) {
        return;
      }

      this._abortController = new AbortController();
      this._abortController.signal.addEventListener('abort', () => {
        this._abortController = undefined;
      });

      if (!this._hoverOptions.allowMultiple) {
        HoverController.globalAbortController?.abort();
        HoverController.globalAbortController = this._abortController;
      }

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
