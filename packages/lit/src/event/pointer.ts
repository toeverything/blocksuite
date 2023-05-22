import { assertExists } from '@blocksuite/global/utils';

import { UIEventStateContext } from './base.js';
import type { UIEventDispatcher } from './dispatcher.js';
import { PointerEventState } from './state.js';
import { isFarEnough } from './utils.js';

export class PointerControl {
  private _lastPointerDownEvent: PointerEvent | null = null;
  private _startDragState: PointerEventState | null = null;
  private _lastDragState: PointerEventState | null = null;
  private _pointerDownCount = 0;
  private _dragging = false;
  private _startX = -Infinity;
  private _startY = -Infinity;

  constructor(private _dispatcher: UIEventDispatcher) {}

  listen() {
    this._dispatcher.disposables.addFromEvent(
      this._dispatcher.root,
      'pointerdown',
      this._down
    );
    this._dispatcher.disposables.addFromEvent(
      this._dispatcher.root,
      'pointermove',
      this._moveOn
    );
    this._dispatcher.disposables.addFromEvent(
      this._dispatcher.root,
      'pointerout',
      this._out
    );
  }

  private get _rect() {
    return this._dispatcher.root.getBoundingClientRect();
  }

  private _reset = () => {
    this._startX = -Infinity;
    this._startY = -Infinity;
    this._lastDragState = null;
    this._dragging = false;
  };

  private _down = (event: PointerEvent) => {
    if (
      this._lastPointerDownEvent &&
      event.timeStamp - this._lastPointerDownEvent.timeStamp < 500 &&
      !isFarEnough(event, this._lastPointerDownEvent)
    ) {
      this._pointerDownCount++;
    } else {
      this._pointerDownCount = 1;
    }

    const pointerEventState = new PointerEventState({
      event,
      rect: this._rect,
      startX: this._startX,
      startY: this._startY,
      last: null,
    });

    this._startX = pointerEventState.point.x;
    this._startY = pointerEventState.point.y;
    this._startDragState = pointerEventState;
    this._lastDragState = pointerEventState;
    this._lastPointerDownEvent = event;

    this._dispatcher.run(
      'pointerDown',
      UIEventStateContext.from(pointerEventState)
    );

    this._dispatcher.disposables.addFromEvent(
      document,
      'pointermove',
      this._move
    );
    this._dispatcher.disposables.addFromEvent(document, 'pointerup', this._up);
  };

  private _up = (event: PointerEvent) => {
    const pointerEventState = new PointerEventState({
      event,
      rect: this._rect,
      startX: this._startX,
      startY: this._startY,
      last: this._lastDragState,
    });
    const context = UIEventStateContext.from(pointerEventState);

    const run = () => {
      if (this._dragging) {
        this._dispatcher.run('dragEnd', context);
        return;
      }
      this._dispatcher.run('click', context);
      if (this._pointerDownCount === 2) {
        this._dispatcher.run('doubleClick', context);
      }
      if (this._pointerDownCount === 3) {
        this._dispatcher.run('tripleClick', context);
      }
    };

    run();
    this._dispatcher.run('pointerUp', context);

    this._reset();
    document.removeEventListener('pointermove', this._move);
    document.removeEventListener('pointerup', this._up);
  };

  private _move = (event: PointerEvent) => {
    const last = this._lastDragState;
    const state = new PointerEventState({
      event,
      rect: this._rect,
      startX: this._startX,
      startY: this._startY,
      last,
    });
    this._lastDragState = state;

    assertExists(this._startDragState);

    if (!this._dragging && isFarEnough(this._startDragState.raw, state.raw)) {
      this._dragging = true;
      this._dispatcher.run(
        'dragStart',
        UIEventStateContext.from(this._startDragState)
      );
      return;
    }

    if (this._dragging) {
      this._dispatcher.run('dragMove', UIEventStateContext.from(state));
    }
  };

  private _moveOn = (event: PointerEvent) => {
    const state = new PointerEventState({
      event,
      rect: this._rect,
      startX: this._startX,
      startY: this._startY,
      last: this._lastDragState,
    });

    this._dispatcher.run('pointerMove', UIEventStateContext.from(state));
  };

  private _out = (event: PointerEvent) => {
    const state = new PointerEventState({
      event,
      rect: this._rect,
      startX: -Infinity,
      startY: -Infinity,
      last: null,
    });

    this._dispatcher.run('pointerOut', UIEventStateContext.from(state));
  };
}
