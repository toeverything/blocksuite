import { type VirtualKeyboardProvider } from '@labre/affine-shared/services';
import { DisposableGroup } from '@labre/global/disposable';
import type { BlockStdScope, ShadowlessElement } from '@labre/std';
import { effect, type Signal } from '@preact/signals-core';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * This controller is used to control the keyboard toolbar position
 */
export class PositionController implements ReactiveController {
  private readonly _disposables = new DisposableGroup();

  host: ReactiveControllerHost &
    ShadowlessElement & {
      std: BlockStdScope;
      panelHeight$: Signal<number>;
      keyboard: VirtualKeyboardProvider;
      panelOpened: boolean;
    };

  constructor(host: PositionController['host']) {
    (this.host = host).addController(this);
  }

  hostConnected() {
    const { keyboard } = this.host;

    this._disposables.add(
      effect(() => {
        if (keyboard.visible$.value) {
          this.host.panelHeight$.value = keyboard.height$.value;
        }
      })
    );

    this.host.style.bottom = '0px';
  }

  hostDisconnected() {
    this._disposables.dispose();
  }
}
