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
      this.std.event.add('keyDown', evt => {
        const state = evt.get('keyboardState');

        this.shiftKey$.value = state.raw.shiftKey && state.raw.key === 'Shift';
        this.spaceKey$.value = state.raw.code === 'Space';
      })
    );

    this._disposable.add(
      this.std.event.add('keyUp', evt => {
        const state = evt.get('keyboardState');

        this.shiftKey$.value = state.raw.shiftKey && state.raw.key === 'Shift';

        if (state.raw.code === 'Space') {
          this.spaceKey$.value = false;
        }
      })
    );
  }

  dispose() {
    this._disposable.dispose();
  }
}
