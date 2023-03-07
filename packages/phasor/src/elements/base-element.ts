import type { IBound } from '../consts.js';
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

  abstract hitTestPoint(
    x: number,
    y: number,
    options?: HitTestOptions
  ): boolean;

  abstract render(_: CanvasRenderingContext2D): void;

  abstract serialize(): Record<string, unknown>;

  /**
   * Different elements could hold different bound-related props.
   * On updating element bound, instead of directly mutating element instance,
   * we need to get these props and set them into Yjs.
   * Then the change will be computed as YEvent, from which we can mutate the element.
   */
  static getBoundProps(_: BaseElement, bound: IBound): Record<string, string> {
    return {
      xywh: serializeXYWH(bound.x, bound.y, bound.w, bound.h),
    };
  }
}
