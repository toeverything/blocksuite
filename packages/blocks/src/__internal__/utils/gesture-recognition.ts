import { MOVE_DETECT_THRESHOLD } from '@blocksuite/global/config';

export interface IPoint {
  x: number;
  y: number;
}

export interface SelectionEvent extends IPoint {
  start: IPoint;
  delta: IPoint;
  raw: PointerEvent | MouseEvent;
  containerOffset: IPoint;
  keys: {
    shift: boolean;
    /** command or control */
    cmd: boolean;
    alt: boolean;
  };
  button?: number;
  dragging: boolean;
  clickCount: number;
}

export function toSelectionEvent(
  // MouseEvent for dblclick and contextmenu
  e: PointerEvent | MouseEvent,
  targetRect: DOMRect,
  startX: number,
  startY: number,
  isDragging: boolean,
  clickCount: number,
  last: SelectionEvent | null = null
): SelectionEvent {
  const delta = { x: 0, y: 0 };
  const start = { x: startX, y: startY };
  const offsetX = e.clientX - targetRect.left;
  const offsetY = e.clientY - targetRect.top;
  const selectionEvent: SelectionEvent = {
    x: offsetX,
    y: offsetY,
    raw: e,
    // absolute position is still **relative** to the nearest positioned ancestor.
    //  In our case, it is the editor. For example, if there is padding/margin in editor,
    //    then the correct absolute `x`/`y` of mouse position is `containerOffset.x - x`
    // Refs: https://developer.mozilla.org/en-US/docs/Web/CSS/position#absolute_positioning
    containerOffset: {
      x: targetRect.left,
      y: targetRect.top,
    },
    delta,
    start,
    keys: {
      shift: e.shiftKey,
      cmd: e.metaKey || e.ctrlKey,
      alt: e.altKey,
    },
    button: e.button,
    dragging: isDragging,
    clickCount,
  };
  if (last) {
    delta.x = offsetX - last.x;
    delta.y = offsetY - last.y;
  }
  return selectionEvent;
}

interface Callbacks {
  onDragStart?: (e: SelectionEvent) => void;
  onDragMove?: (e: SelectionEvent) => void;
  onDragEnd?: (e: SelectionEvent) => void;
  onClick?: (e: SelectionEvent) => void;
  onDblClick?: (e: SelectionEvent) => void;
  onTripleClick?: (e: SelectionEvent) => void;

  onPointerDown?: (e: SelectionEvent) => void;
  onPointerMove?: (e: SelectionEvent) => void;
  onPointerUp?: (e: SelectionEvent) => void;
  onPointerOut?: (e: SelectionEvent) => void;
}

function isFarEnough(a: IPoint, b: IPoint, d = MOVE_DETECT_THRESHOLD) {
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) > d * d;
}

type EventFilter = (event: SelectionEvent) => boolean;
type EventProcessor = (event: SelectionEvent) => void;

export class GestureRecognition {
  private _target: HTMLElement;
  private _callbacks: Callbacks;
  private _eventFilter: EventFilter;
  private _eventProcessor: EventProcessor;

  private _startX = -Infinity;
  private _startY = -Infinity;
  private _lastEvent: SelectionEvent | null = null;
  private _isDragging = false;
  private _isPointerDown = false;
  private _clickCount = 0;

  get isDragging() {
    return this._isDragging;
  }

  constructor(
    target: HTMLElement,
    callbacks: Callbacks,
    options: {
      eventFilter?: EventFilter;
      eventProcessor?: EventProcessor;
    } = {}
  ) {
    this._target = target;
    this._callbacks = callbacks;
    this._eventFilter = options.eventFilter ?? (() => false);
    this._eventProcessor =
      options.eventProcessor ??
      (() => {
        return;
      });

    this.listen();
  }

  private _getTargetRect(): DOMRect {
    return this._target.getBoundingClientRect();
  }

  private _pointerdown = (event: PointerEvent) => {
    const rect = this._getTargetRect();

    const startX = event.clientX - rect.left;
    const startY = event.clientY - rect.top;
    const clickCount =
      this._lastEvent && event.timeStamp - this._lastEvent.raw.timeStamp < 500
        ? this._clickCount + 1
        : 1;

    const selectionEvent = toSelectionEvent(
      event,
      rect,
      startX,
      startY,
      false,
      clickCount
    );

    if (this._eventFilter(selectionEvent)) {
      return;
    }
    this._eventProcessor(selectionEvent);

    this._startX = startX;
    this._startY = startY;
    this._isDragging = false;
    this._isPointerDown = true;
    this._clickCount = clickCount;

    // e.button is 0 means left button
    if (!event.button) {
      this._lastEvent = selectionEvent;
    }

    this._callbacks.onPointerDown?.(selectionEvent);

    document.addEventListener('pointerup', this._pointerup);
    document.addEventListener('pointerout', this._pointerout);
  };

  private _pointermove = (event: PointerEvent) => {
    const rect = this._getTargetRect();

    const a = { x: this._startX, y: this._startY };
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const b = { x: offsetX, y: offsetY };

    const selectionEvent = toSelectionEvent(
      event,
      rect,
      this._startX,
      this._startY,
      this._isDragging,
      this._clickCount,
      this._lastEvent
    );

    if (this._eventFilter(selectionEvent)) {
      return;
    }
    this._eventProcessor(selectionEvent);

    if (!this._lastEvent) {
      this._callbacks.onPointerMove?.(selectionEvent);
      return;
    }

    if (
      this._isPointerDown &&
      this._clickCount === 1 &&
      isFarEnough(a, b) &&
      !this._isDragging
    ) {
      this._isDragging = true;
      this._callbacks.onDragStart?.(this._lastEvent);
    }

    if (this._isDragging) {
      this._callbacks.onDragMove?.(selectionEvent);
      this._callbacks.onPointerMove?.(selectionEvent);
      this._lastEvent = selectionEvent;
    }
  };

  private _pointerup = (event: PointerEvent) => {
    const selectionEvent = toSelectionEvent(
      event,
      this._getTargetRect(),
      this._startX,
      this._startY,
      this._isDragging,
      this._clickCount,
      this._lastEvent
    );

    if (this._eventFilter(selectionEvent)) {
      return;
    }
    this._eventProcessor(selectionEvent);

    this._callbacks.onPointerUp?.(selectionEvent);

    if (this._clickCount === 1) {
      if (this._isDragging) {
        this._callbacks.onDragEnd?.(selectionEvent);
      } else {
        this._callbacks.onClick?.(selectionEvent);
      }
    } else if (this._clickCount === 2) {
      this._callbacks.onDblClick?.(selectionEvent);
    } else if (this._clickCount === 3) {
      this._callbacks.onTripleClick?.(selectionEvent);
    } else {
      this._callbacks.onClick?.(selectionEvent);
    }

    this._startX = -Infinity;
    this._startY = -Infinity;
    this._isDragging = false;
    this._isPointerDown = false;
    // this._lastEvent = null;

    document.removeEventListener('pointerup', this._pointerup);
    document.removeEventListener('pointerout', this._pointerout);
  };

  private _pointerout(event: PointerEvent) {
    const selectionEvent = toSelectionEvent(
      event,
      this._getTargetRect(),
      this._startX,
      this._startY,
      this._isDragging,
      this._clickCount
    );
    if (this._eventFilter(selectionEvent)) {
      return;
    }
    this._callbacks.onPointerOut?.(selectionEvent);
  }

  listen() {
    const target = this._target;

    target.addEventListener('pointerdown', this._pointerdown);
    target.addEventListener('pointermove', this._pointermove);
  }

  dispose() {
    const target = this._target;

    target.removeEventListener('pointerdown', this._pointerdown);
    target.removeEventListener('pointermove', this._pointermove);
  }
}
