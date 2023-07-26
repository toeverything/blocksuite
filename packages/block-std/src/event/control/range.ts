import { UIEventState, UIEventStateContext } from '../base.js';
import type { UIEventDispatcher } from '../dispatcher.js';

export class RangeControl {
  constructor(private _dispatcher: UIEventDispatcher) {}

  listen() {
    this._dispatcher.disposables.addFromEvent(
      document,
      'selectionchange',
      this._selectionChange
    );
  }

  private _createContext(event: Event) {
    return UIEventStateContext.from(new UIEventState(event));
  }

  private _selectionChange = (event: Event) => {
    this._dispatcher.run('selectionChange', this._createContext(event));
  };
}
