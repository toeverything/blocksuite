import { deserializeXYWH, serializeXYWH } from '../utils/xywh.js';

export interface SurfaceElement {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HitTestOptions {
  expandStroke: boolean;
  fillHollow: boolean;
}

export type TransformPropertyValue = (value: string) => string;
export function defaultTransformPropertyValue(v: string) {
  return v;
}

export abstract class BaseElement implements SurfaceElement {
  abstract type: string;
  id: string;
  index!: string;
  transformPropertyValue: TransformPropertyValue = v => v;

  x = 0;
  y = 0;
  w = 0;
  h = 0;

  constructor(id: string) {
    this.id = id;
  }

  get centerX() {
    return this.x + this.w / 2;
  }

  get centerY() {
    return this.y + this.h / 2;
  }

  protected get _xywh() {
    return serializeXYWH(this.x, this.y, this.w, this.h);
  }

  abstract hitTest(x: number, y: number, options?: HitTestOptions): boolean;

  abstract render(_: CanvasRenderingContext2D): void;

  abstract serialize(): Record<string, unknown>;

  static applySerializedProps(element: object, props: Record<string, unknown>) {
    Object.assign(element, { ...props });

    const { xywh } = props;
    if (xywh) {
      const [x, y, w, h] = deserializeXYWH(xywh as string);
      Object.assign(element, { x, y, w, h });
    }
  }

  static getUpdatedSerializedProps(
    element: object,
    props: Record<string, unknown>
  ) {
    const updated = { ...props };

    return updated;
  }
}
