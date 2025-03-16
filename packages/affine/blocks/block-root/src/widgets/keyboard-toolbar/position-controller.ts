import { type VirtualKeyboardProvider } from '@blocksuite/affine-shared/services';
import type { BlockStdScope, ShadowlessElement } from '@blocksuite/block-std';
import { DisposableGroup } from '@blocksuite/global/disposable';
import { effect, type Signal } from '@preact/signals-core';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

import { TOOLBAR_HEIGHT } from './styles';

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
    const { keyboard, panelOpened } = this.host;

    this._disposables.add(
      effect(() => {
        if (keyboard.visible$.value) {
          this.host.panelHeight$.value = keyboard.height$.value;
        }
      })
    );

    this.host.style.bottom = '0px';
    this._disposables.add(
      effect(() => {
        if (keyboard.visible$.value) {
          document.body.style.paddingBottom = `${keyboard.height$.value + TOOLBAR_HEIGHT}px`;
        } else if (panelOpened) {
          document.body.style.paddingBottom = `${this.host.panelHeight$.peek() + TOOLBAR_HEIGHT}px`;
        } else {
          document.body.style.paddingBottom = '';
        }
      })
    );
    this._disposables.add(() => {
      document.body.style.paddingBottom = '';
    });
  }

  hostDisconnected() {
    this._disposables.dispose();
  }
}
