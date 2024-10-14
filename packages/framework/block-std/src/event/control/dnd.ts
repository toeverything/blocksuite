import type { UIEventDispatcher } from '../dispatcher.js';

import { UIEventState, UIEventStateContext } from '../base.js';
import {
  DndEventState,
  EventScopeSourceType,
  EventSourceState,
} from '../state/index.js';

export class DndControl {
  private _nativeDragEnd = (event: DragEvent) => {
    const dndEventState = new DndEventState({ event });
    this._dispatcher.run(
      'nativeDragEnd',
      this._createContext(event, dndEventState)
    );
  };

  private _nativeDragMove = (event: DragEvent) => {
    const dndEventState = new DndEventState({ event });
    this._dispatcher.run(
      'nativeDragMove',
      this._createContext(event, dndEventState)
    );
  };

  private _nativeDragStart = (event: DragEvent) => {
    const dndEventState = new DndEventState({ event });
    this._dispatcher.run(
      'nativeDragStart',
      this._createContext(event, dndEventState)
    );
  };

  private _nativeDrop = (event: DragEvent) => {
    const dndEventState = new DndEventState({ event });
    this._dispatcher.run(
      'nativeDrop',
      this._createContext(event, dndEventState)
    );
  };

  constructor(private _dispatcher: UIEventDispatcher) {}

  private _createContext(event: Event, dndState: DndEventState) {
    return UIEventStateContext.from(
      new UIEventState(event),
      new EventSourceState({
        event,
        sourceType: EventScopeSourceType.Target,
      }),
      dndState
    );
  }

  listen() {
    this._dispatcher.disposables.addFromEvent(
      this._dispatcher.host,
      'dragstart',
      this._nativeDragStart
    );
    this._dispatcher.disposables.addFromEvent(
      this._dispatcher.host,
      'dragend',
      this._nativeDragEnd
    );
    this._dispatcher.disposables.addFromEvent(
      this._dispatcher.host,
      'drag',
      this._nativeDragMove
    );
    this._dispatcher.disposables.addFromEvent(
      this._dispatcher.host,
      'drop',
      this._nativeDrop
    );
  }
}
