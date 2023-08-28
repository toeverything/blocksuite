import { UIEventState, UIEventStateContext } from '../base.js';
import type { UIEventDispatcher } from '../dispatcher.js';

export class PassiveControl {
  constructor(private _dispatcher: UIEventDispatcher) {}

  listen() {
    this._dispatcher.disposables.addFromEvent(
      this._dispatcher.root,
      'wheel',
      this._wheel,
      { passive: true }
    );
  }

  private _wheel = (event: WheelEvent) => {
    this._dispatcher.run(
      'wheel',
      UIEventStateContext.from(new UIEventState(event))
    );
  };
}
