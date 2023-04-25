import { assertExists, DisposableGroup } from '@blocksuite/store';

import { type SelectionEvent, toSelectionEvent } from './selection-event.js';
import { isFarEnough } from './utils.js';

interface Callbacks {
  onDragStart?: (e: SelectionEvent) => void;
  onDragMove?: (e: SelectionEvent) => void;
  onDragEnd?: (e: SelectionEvent) => void;

  onPointerDown?: (e: SelectionEvent) => void;
  onPointerMove?: (e: SelectionEvent) => void;
  onPointerUp?: (e: SelectionEvent) => void;
  onPointerOut?: (e: SelectionEvent) => void;

  onClick?: (e: SelectionEvent) => void;
  onDblClick?: (e: SelectionEvent) => void;
  onTripleClick?: (e: SelectionEvent) => void;
}

export class Recognizer {
  private _target: HTMLElement;
  private _callbacks: Callbacks = {};

  private _pointerDownCount = 0;
  private _lastPointerDownEvent: PointerEvent | null = null;

  private _startX = -Infinity;
  private _startY = -Infinity;
  private _lastSelectionEventForDrag: SelectionEvent | null = null;
  private _dragging = false;

  constructor(target: HTMLElement, callbacks: Callbacks = {}) {
    this._target = target;
    this._callbacks = callbacks;

    this.listen();
  }

  listen() {
    this._target.addEventListener('pointerdown', this._pointerdown);
    this._target.addEventListener(
      'pointermove',
      this._pointermoveCaptureByTarget
    );
    this._target.addEventListener('pointerout', this._pointerout);
  }

  dispose() {
    this._target.removeEventListener('pointerdown', this._pointerdown);
    this._target.removeEventListener(
      'pointermove',
      this._pointermoveCaptureByTarget
    );
    this._target.removeEventListener('pointerout', this._pointerout);

    if (this._pointerDownCount) {
      document.removeEventListener('pointermove', this._pointermove);
      document.removeEventListener('pointerup', this._pointerup);
    }
  }

  private _dispatchEvent(
    eventName: keyof Callbacks,
    selectionEvent: SelectionEvent
  ) {
    this._callbacks[eventName]?.(selectionEvent);
  }

  private _getTargetBoundingRect = () => {
    return this._target.getBoundingClientRect();
  };

  private _pointerdown = (event: PointerEvent) => {
    if (
      this._lastPointerDownEvent &&
      event.timeStamp - this._lastPointerDownEvent.timeStamp < 500
    ) {
      this._pointerDownCount++;
    } else {
      this._pointerDownCount = 1;
    }

    const selectionEvent = toSelectionEvent({
      event,
      getBoundingClientRect: this._getTargetBoundingRect,
      startX: this._startX,
      startY: this._startY,
      last: null,
    });

    this._startX = selectionEvent.x;
    this._startY = selectionEvent.y;
    this._lastSelectionEventForDrag = selectionEvent;
    this._lastPointerDownEvent = event;

    this._dispatchEvent('onPointerDown', selectionEvent);
    document.addEventListener('pointermove', this._pointermove);
    document.addEventListener('pointerup', this._pointerup);
  };

  private _pointermove = (event: PointerEvent) => {
    const lastSelectionEvent = this._lastSelectionEventForDrag;
    const selectionEvent = toSelectionEvent({
      event,
      getBoundingClientRect: this._getTargetBoundingRect,
      startX: this._startX,
      startY: this._startY,
      last: lastSelectionEvent,
    });
    this._lastSelectionEventForDrag = selectionEvent;

    assertExists(lastSelectionEvent);

    if (
      !this._dragging &&
      isFarEnough({ x: this._startX, y: this._startY }, selectionEvent)
    ) {
      this._dragging = true;
      this._dispatchEvent('onDragStart', lastSelectionEvent);
    }

    if (this._dragging) {
      this._dispatchEvent('onDragMove', selectionEvent);
    }
  };

  private _pointermoveCaptureByTarget = (event: PointerEvent) => {
    const selectionEvent = toSelectionEvent({
      event,
      getBoundingClientRect: this._getTargetBoundingRect,
      startX: -Infinity,
      startY: -Infinity,
      last: null,
    });
    this._dispatchEvent('onPointerMove', selectionEvent);
  };

  private _pointerup = (event: PointerEvent) => {
    const selectionEvent = toSelectionEvent({
      event,
      getBoundingClientRect: this._getTargetBoundingRect,
      startX: this._startX,
      startY: this._startY,
      last: this._lastSelectionEventForDrag,
    });

    this._dispatchEvent('onPointerUp', selectionEvent);

    if (this._dragging) {
      this._dispatchEvent('onDragEnd', selectionEvent);
    } else {
      this._dispatchEvent('onClick', selectionEvent);
      if (this._pointerDownCount === 2) {
        this._dispatchEvent('onDblClick', selectionEvent);
      } else if (this._pointerDownCount === 3) {
        this._dispatchEvent('onTripleClick', selectionEvent);
      }
    }

    this._startX = -Infinity;
    this._startY = -Infinity;
    this._lastSelectionEventForDrag = null;
    this._dragging = false;

    document.removeEventListener('pointermove', this._pointermove);
    document.removeEventListener('pointerup', this._pointerup);
  };

  private _pointerout = (event: PointerEvent) => {
    const selectionEvent = toSelectionEvent({
      event,
      getBoundingClientRect: this._getTargetBoundingRect,
      startX: -Infinity,
      startY: -Infinity,
      last: null,
    });
    this._dispatchEvent('onPointerOut', selectionEvent);
  };
}
