import type { IPoint } from './utils.js';

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
}

export function toSelectionEvent({
  event,
  getBoundingClientRect,
  startX,
  startY,
  last = null,
}: {
  event: PointerEvent | MouseEvent;
  getBoundingClientRect: () => DOMRect;
  startX: number;
  startY: number;
  last: SelectionEvent | null;
}): SelectionEvent {
  const rect = getBoundingClientRect();
  const delta = { x: 0, y: 0 };
  const start = { x: startX, y: startY };
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;
  const selectionEvent: SelectionEvent = {
    x: offsetX,
    y: offsetY,
    raw: event,
    // absolute position is still **relative** to the nearest positioned ancestor.
    //  In our case, it is the editor. For example, if there is padding/margin in editor,
    //    then the correct absolute `x`/`y` of mouse position is `containerOffset.x - x`
    // Refs: https://developer.mozilla.org/en-US/docs/Web/CSS/position#absolute_positioning
    containerOffset: {
      x: rect.left,
      y: rect.top,
    },
    delta,
    start,
    keys: {
      shift: event.shiftKey,
      cmd: event.metaKey || event.ctrlKey,
      alt: event.altKey,
    },
    button: last?.button || event.button,
    dragging: !!last,
  };
  if (last) {
    delta.x = offsetX - last.x;
    delta.y = offsetY - last.y;
  }
  return selectionEvent;
}
