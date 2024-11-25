import { DisposableGroup } from '@blocksuite/global/utils';
import { Signal } from '@preact/signals-core';

import type { BlockStdScope } from '../scope/block-std-scope.js';

export class KeyboardController {
  private _disposable = new DisposableGroup();

  shiftKey$ = new Signal<boolean>(false);

  spaceKey$ = new Signal<boolean>(false);

  constructor(readonly std: BlockStdScope) {
    this._init();
  }

  private _init() {
    this._disposable.add(
      this._listenKeyboard('keydown', evt => {
        this.shiftKey$.value = evt.shiftKey && evt.key === 'Shift';
        this.spaceKey$.value = evt.code === 'Space';
      })
    );

    this._disposable.add(
      this._listenKeyboard('keyup', evt => {
        this.shiftKey$.value = evt.shiftKey ? true : false;

        if (evt.code === 'Space') {
          this.spaceKey$.value = false;
        }
      })
    );
  }

  private _listenKeyboard(
    event: 'keydown' | 'keyup',
    callback: (keyboardEvt: KeyboardEvent) => void
  ) {
    const handler = (evt: KeyboardEvent) => {
      if ((evt.target as HTMLElement).tagName === 'INPUT') {
        return;
      }

      callback(evt);
    };

    document.addEventListener(event, handler, false);

    return () => {
      document.removeEventListener(event, handler, false);
    };
  }

  dispose() {
    this._disposable.dispose();
  }
}
