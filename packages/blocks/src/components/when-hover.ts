import { DisposableGroup, whenHover } from '@blocksuite/global/utils';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

import type { AdvancedPortalOptions } from './portal.js';
import { createLitPortal } from './portal.js';

type OptionsParams = Omit<ReturnType<typeof whenHover>, 'dispose'> & {
  abortController: AbortController;
};
type WhenHoverOptions = Omit<AdvancedPortalOptions, 'abortController'>;

export class WhenHoverController implements ReactiveController {
  protected _disposables = new DisposableGroup();
  host: ReactiveControllerHost;

  private _abortController?: AbortController;
  private _setReference?: (element?: Element | undefined) => void;
  private _portal?: HTMLDivElement;
  private readonly _options: (options: OptionsParams) => WhenHoverOptions;

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
    options: (options: OptionsParams) => WhenHoverOptions
  ) {
    (this.host = host).addController(this);
    this._options = options;
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
      this._portal = createLitPortal({
        ...this._options({
          setReference,
          setFloating,
          abortController: this._abortController,
        }),
        abortController: this._abortController,
      });
    });
    this._setReference = setReference;
    this._disposables.add(dispose);
  }

  hostDisconnected() {
    this._disposables.dispose();
  }
}
