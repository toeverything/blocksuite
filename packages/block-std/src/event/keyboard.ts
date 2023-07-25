import { UIEventState, UIEventStateContext } from './base.js';
import type { UIEventDispatcher } from './dispatcher.js';
import { KeyboardEventState } from './state.js';

export class KeyboardControl {
  constructor(private _dispatcher: UIEventDispatcher) {}

  private _createContext(event: Event, keyboardState: KeyboardEventState) {
    return UIEventStateContext.from(
      new UIEventState(event),
      this._dispatcher.createEventBlockState(event),
      keyboardState
    );
  }

  listen() {
    this._dispatcher.disposables.addFromEvent(
      this._dispatcher.root,
      'keydown',
      this._down
    );
    this._dispatcher.disposables.addFromEvent(
      this._dispatcher.root,
      'keyup',
      this._up
    );
  }

  private _down = (event: KeyboardEvent) => {
    const keyboardEventState = new KeyboardEventState({
      event,
    });

    this._dispatcher.run(
      'keyDown',
      this._createContext(event, keyboardEventState)
    );
  };

  private _up = (event: KeyboardEvent) => {
    const keyboardEventState = new KeyboardEventState({
      event,
    });

    this._dispatcher.run(
      'keyUp',
      this._createContext(event, keyboardEventState)
    );
  };
}
