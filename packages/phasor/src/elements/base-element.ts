import { serializeXYWH } from '../utils/xywh.js';

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

export abstract class BaseElement implements SurfaceElement {
  abstract type: string;
  id: string;
  index!: string;

  abstract get x(): number;
  abstract get y(): number;
  abstract get w(): number;
  abstract get h(): number;

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
}
