import {
  type UIEventHandler,
  UIEventState,
  UIEventStateContext,
} from '../base.js';
import type { EventOptions, UIEventDispatcher } from '../dispatcher.js';
import { bindKeymap } from '../keymap.js';
import { KeyboardEventState } from '../state/index.js';
import { EventScopeSourceType, EventSourceState } from '../state/source.js';

export class KeyboardControl {
  private composition = false;

  constructor(private _dispatcher: UIEventDispatcher) {}

  private _createContext(event: Event, keyboardState: KeyboardEventState) {
    return UIEventStateContext.from(
      new UIEventState(event),
      new EventSourceState({
        event,
        sourceType: EventScopeSourceType.Selection,
      }),
      keyboardState
    );
  }

  private _down = (event: KeyboardEvent) => {
    const keyboardEventState = new KeyboardEventState({
      event,
      composing: this.composition,
    });
    this._dispatcher.run(
      'keyDown',
      this._createContext(event, keyboardEventState)
    );
  };

  private _up = (event: KeyboardEvent) => {
    const keyboardEventState = new KeyboardEventState({
      event,
      composing: this.composition,
    });

    this._dispatcher.run(
      'keyUp',
      this._createContext(event, keyboardEventState)
    );
  };

  listen() {
    this._dispatcher.disposables.addFromEvent(document, 'keydown', this._down);
    this._dispatcher.disposables.addFromEvent(document, 'keyup', this._up);
    this._dispatcher.disposables.addFromEvent(
      document,
      'compositionstart',
      () => {
        this.composition = true;
      }
    );
    this._dispatcher.disposables.addFromEvent(
      document,
      'compositionend',
      () => {
        this.composition = false;
      }
    );
  }

  bindHotkey(keymap: Record<string, UIEventHandler>, options?: EventOptions) {
    return this._dispatcher.add(
      'keyDown',
      ctx => {
        if (this.composition) {
          return false;
        }
        const binding = bindKeymap(keymap);
        return binding(ctx);
      },
      options
    );
  }
}
