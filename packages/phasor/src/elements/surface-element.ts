import type { RoughCanvas } from 'roughjs/bin/canvas.js';
import type * as Y from 'yjs';

import type { Renderer } from '../renderer.js';
import type { SurfaceManager } from '../surface.js';
import { isPointIn } from '../utils/math-utils.js';
import { deserializeXYWH, type SerializedXYWH } from '../utils/xywh.js';

export interface ISurfaceElement {
  id: string;
  type: string;
  xywh: SerializedXYWH;
  index: string;
  seed: number;
}
export type SurfaceElementKey = keyof ISurfaceElement;
export interface ISurfaceElementView extends ISurfaceElement {
  display: boolean;
  opacity: number;
}

export interface HitTestOptions {
  expandStroke: boolean;
  fillHollow: boolean;
}

export type ComputedValue = (value: string) => string;

export class SurfaceElement<
  T extends ISurfaceElement = ISurfaceElement,
  K extends ISurfaceElementView = ISurfaceElementView
> {
  yMap: Y.Map<unknown>;

  protected renderer: Renderer | null = null;
  protected surface: SurfaceManager | null = null;
  protected _view = {} as K;

  computedValue: ComputedValue = v => v;

  constructor(
    yMap: Y.Map<unknown>,
    surface: SurfaceManager,
    data: Partial<T> = {},
    viewData: Partial<K> = {}
  ) {
    if (!yMap.doc) {
      throw new Error('yMap must be bound to a Y.Doc');
    }

    this.yMap = yMap;

    for (const key in data) {
      this.yMap.set(key, data[key] as T[keyof T]);
    }

    viewData.display = viewData.display ?? true;
    viewData.opacity = viewData.opacity ?? 1;

    [
      ...Array.from(this.yMap.entries()),
      ...Array.from(Object.entries(viewData)),
    ].forEach(([key, value]) => {
      Object.defineProperty(this.view, key, {
        value,
        writable: false,
        configurable: true,
      });
    });
    this.surface = surface;
  }

  get view(): K {
    return this._view;
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

  applyViewUpdate(updates: Partial<K>) {
    for (const key in updates) {
      Object.defineProperty(this.view, key, {
        value: updates[key],
      });
    }
    this.renderer?.removeElement(this);
    this.renderer?.addElement(this);
  }

  serialize(): T {
    return this.yMap.toJSON() as T;
  }

  hitTest(x: number, y: number, options?: HitTestOptions) {
    return isPointIn(this, x, y);
  }

  mount(renderer: Renderer) {
    this.renderer = renderer;
    this.renderer.addElement(this);
  }

  unmount() {
    this.renderer?.removeElement(this);
    this.renderer = null;
  }

  render(ctx: CanvasRenderingContext2D, rc: RoughCanvas) {
    return;
  }
}
