import { UIEventStateContext } from './base.js';
import type { UIEventDispatcher } from './dispatcher.js';
import { KeyboardEventState } from './state.js';

export class KeyboardControl {
  constructor(private _dispatcher: UIEventDispatcher) {}

  listen() {
    this._dispatcher.disposables.addFromEvent(document, 'keydown', this._down);
    this._dispatcher.disposables.addFromEvent(document, 'keyup', this._up);
  }

  private _down = (event: KeyboardEvent) => {
    const keyboardEventState = new KeyboardEventState({
      event,
    });

    this._dispatcher.run(
      'keyDown',
      UIEventStateContext.from(keyboardEventState)
    );
  };

  private _up = (event: KeyboardEvent) => {
    const keyboardEventState = new KeyboardEventState({
      event,
    });

    this._dispatcher.run('keyUp', UIEventStateContext.from(keyboardEventState));
  };
}
