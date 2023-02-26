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

  setBound(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  abstract hitTest(x: number, y: number, options?: HitTestOptions): boolean;

  abstract render(_: CanvasRenderingContext2D): void;

  abstract serialize(): Record<string, unknown>;
}
