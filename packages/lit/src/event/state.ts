import { UIEventState } from './base.js';

type PointerEventStateOptions = {
  event: PointerEvent;
  rect: DOMRect;
  startX: number;
  startY: number;
  last: PointerEventState | null;
};

type Point = { x: number; y: number };

export class PointerEventState extends UIEventState {
  override readonly type = 'pointerState';

  raw: PointerEvent;
  point: Point;
  containerOffset: Point;
  start: Point;
  delta: Point;
  keys: {
    shift: boolean;
    cmd: boolean;
    alt: boolean;
  };
  button: number;
  dragging: boolean;

  constructor({ event, rect, startX, startY, last }: PointerEventStateOptions) {
    super(event as Event);

    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    this.raw = event;
    this.point = { x: offsetX, y: offsetY };
    this.containerOffset = { x: rect.left, y: rect.top };
    this.start = { x: startX, y: startY };
    this.delta = last
      ? { x: offsetX - last.point.x, y: offsetY - last.point.y }
      : { x: 0, y: 0 };
    this.keys = {
      shift: event.shiftKey,
      cmd: event.metaKey || event.ctrlKey,
      alt: event.altKey,
    };
    this.button = last?.button || event.button;
    this.dragging = !!last;
  }
}
