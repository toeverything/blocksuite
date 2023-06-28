import type * as Y from 'yjs';

import type { Renderer } from '../renderer.js';
import type { RoughCanvas } from '../rough/canvas.js';
import type { SurfaceManager } from '../surface.js';
import { isPointIn } from '../utils/math-utils.js';
import type { IVec } from '../utils/vec.js';
import { deserializeXYWH, type SerializedXYWH } from '../utils/xywh.js';
import type { IElementUpdateProps, IPhasorElementType } from './index.js';

export interface ISurfaceElement {
  id: string;
  type: string;
  xywh: SerializedXYWH;
  index: string;
  seed: number;
}

export interface HitTestOptions {
  expand: number;
}

export type ComputedValue = (value: string) => string;

export abstract class SurfaceElement<
  T extends ISurfaceElement = ISurfaceElement
> {
  abstract intersectWithLine(start: IVec, end: IVec): IVec[] | null;
  abstract getNearestPoint(point: IVec): IVec;

  yMap: Y.Map<unknown>;

  protected renderer: Renderer | null = null;
  protected _connectable = true;

  computedValue: ComputedValue = v => v;

  constructor(
    yMap: Y.Map<unknown>,
    protected surface: SurfaceManager,
    data: Partial<T> = {}
  ) {
    if (!yMap.doc) {
      throw new Error('yMap must be bound to a Y.Doc');
    }

    this.yMap = yMap;
    for (const key in data) {
      this.yMap.set(key, data[key] as T[keyof T]);
    }

    this.surface = surface;
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

  get localRecord() {
    return this.surface.getElementLocalRecord(this.id);
  }

  get connectable() {
    return this._connectable;
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

  private _onMap = <T extends keyof IPhasorElementType>(
    events: Y.YEvent<Y.Map<unknown>>[]
  ) => {
    this.renderer?.removeElement(this);
    this.renderer?.addElement(this);
    const e = events[0] as Y.YMapEvent<Y.Map<unknown>>;
    const props: IElementUpdateProps<T> = {};
    e.keysChanged.forEach(key => {
      props[key as keyof IElementUpdateProps<T>] = this.yMap.get(
        key
      ) as IPhasorElementType[T][keyof IElementUpdateProps<T>];
    });
    this.surface.slots.elementPropertyUpdated.emit({
      id: this.id,
      properties: props,
    });
  };

  mount(renderer: Renderer) {
    this.renderer = renderer;
    this.renderer.addElement(this);
    this.yMap.observeDeep(this._onMap);
  }

  unmount() {
    this.yMap.unobserveDeep(this._onMap);
    this.renderer?.removeElement(this);
    this.renderer = null;
  }

  render(ctx: CanvasRenderingContext2D, rc: RoughCanvas) {
    return;
  }
}
