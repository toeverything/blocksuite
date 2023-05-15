import type { RoughCanvas } from 'roughjs/bin/canvas.js';
import type * as Y from 'yjs';

import type { Renderer } from '../renderer.js';
import { isPointIn } from '../utils/hit-utils.js';
import { deserializeXYWH, type SerializedXYWH } from '../utils/xywh.js';

export interface ISurfaceElement {
  id: string;
  index: string;
  type: string;
  xywh: SerializedXYWH;
  seed: number;
}

export interface HitTestOptions {
  expandStroke: boolean;
  fillHollow: boolean;
}

export type TransformPropertyValue = (value: string) => string;

export class SurfaceElement<T extends ISurfaceElement = ISurfaceElement> {
  yMap: Y.Map<unknown>;

  private _renderer: Renderer | null = null;

  transformPropertyValue: TransformPropertyValue = v => v;

  constructor(yMap: Y.Map<unknown>, data?: T) {
    if (!yMap.doc) {
      throw new Error('yMap must be bound to a Y.Doc');
    }

    this.yMap = yMap;
    if (data) {
      for (const key in data) {
        this.yMap.set(key, data[key] as T[keyof T]);
      }
    }
  }

  get id() {
    const id = this.yMap.get('id') as T['id'];
    return id;
  }

  get index() {
    const index = this.yMap.get('index') as T['index'];
    return index;
  }

  get type() {
    const type = this.yMap.get('type') as T['type'];
    return type;
  }

  get xywh() {
    const xywh = this.yMap.get('xywh') as T['xywh'];
    return xywh;
  }

  get x() {
    const [x] = deserializeXYWH(this.xywh);
    return x;
  }

  get y() {
    const [, y] = deserializeXYWH(this.xywh);
    return y;
  }

  get w() {
    const [, , w] = deserializeXYWH(this.xywh);
    return w;
  }

  get h() {
    const [, , , h] = deserializeXYWH(this.xywh);
    return h;
  }

  get seed() {
    const seed = this.yMap.get('seed') as T['seed'];
    return seed;
  }

  applyUpdate(updates: Partial<T>) {
    for (const key in updates) {
      this.yMap.set(key, updates[key] as T[keyof T]);
    }
  }

  serialize(): T {
    return this.yMap.toJSON() as T;
  }

  hitTest(x: number, y: number, options?: HitTestOptions) {
    return isPointIn(this, x, y);
  }

  mount(renderer: Renderer) {
    this._renderer = renderer;
    this._renderer.addElement(this);
    this.yMap.observeDeep(() => {
      this._renderer?.removeElement(this);
      this._renderer?.addElement(this);
    });
  }

  unmount() {
    this._renderer?.removeElement(this);
    this._renderer = null;
  }

  render(ctx: CanvasRenderingContext2D, rc: RoughCanvas) {
    return;
  }
}
