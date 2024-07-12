import { UIEventState } from '../base.js';

type PointerEventStateOptions = {
  event: PointerEvent;
  last: PointerEventState | null;
  rect: DOMRect;
  startX: number;
  startY: number;
};

type Point = { x: number; y: number };

export class PointerEventState extends UIEventState {
  button: number;

  containerOffset: Point;

  delta: Point;

  dragging: boolean;

  keys: {
    alt: boolean;
    cmd: boolean;
    shift: boolean;
  };

  point: Point;

  pressure: number;

  raw: PointerEvent;

  start: Point;

  override type = 'pointerState';

  constructor({ event, last, rect, startX, startY }: PointerEventStateOptions) {
    super(event);

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
      alt: event.altKey,
      cmd: event.metaKey || event.ctrlKey,
      shift: event.shiftKey,
    };
    this.button = last?.button || event.button;
    this.dragging = !!last;
    this.pressure = event.pressure;
  }

  get x() {
    return this.point.x;
  }

  get y() {
    return this.point.y;
  }
}

declare global {
  interface BlockSuiteUIEventState {
    pointerState: PointerEventState;
  }
}
