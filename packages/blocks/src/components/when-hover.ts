import {
  DisposableGroup,
  whenHover,
  type WhenHoverOptions,
} from '@blocksuite/global/utils';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

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
  setPortalAsFloating: boolean;
} & WhenHoverOptions;

const DEFAULT_HOVER_OPTIONS: HoverOptions = {
  setPortalAsFloating: true,
};

export class WhenHoverController implements ReactiveController {
  protected _disposables = new DisposableGroup();
  host: ReactiveControllerHost;

  private _abortController?: AbortController;
  private _setReference?: (element?: Element | undefined) => void;
  private _portal?: HTMLDivElement;
  private readonly _onHover: (options: OptionsParams) => HoverPortalOptions;
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
    onHover: (options: OptionsParams) => HoverPortalOptions,
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
        this._abortController?.abort();
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
      this._portal = createLitPortal({
        ...portalOptions,
        abortController: this._abortController,
      });

      if (this._hoverOptions.setPortalAsFloating) {
        setFloating(this._portal);
      }
    }, this._hoverOptions);
    this._setReference = setReference;
    this._disposables.add(dispose);
  }

  hostDisconnected() {
    this._disposables.dispose();
  }
}
