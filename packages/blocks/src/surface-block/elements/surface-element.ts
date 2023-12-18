import type { Y } from '@blocksuite/store';

import type { EdgelessElement, GroupElement } from '../../index.js';
import type { EdgelessSelectionManager } from '../../page-block/edgeless/services/selection-manager.js';
import type { Renderer } from '../renderer.js';
import type { RoughCanvas } from '../rough/canvas.js';
import { Bound } from '../utils/bound.js';
import { getBoundsWithRotation, isPointIn } from '../utils/math-utils.js';
import { type PointLocation } from '../utils/point-location.js';
import type { IVec } from '../utils/vec.js';
import {
  deserializeXYWH,
  type SerializedXYWH,
  type XYWH,
} from '../utils/xywh.js';
import type {
  CanvasElementType,
  HitTestOptions,
  IEdgelessElement,
} from './edgeless-element.js';

export interface ISurfaceElement {
  id: string;
  type: CanvasElementType;
  xywh: SerializedXYWH;
  index: string;
  seed: number;

  // degree: [0, 360]
  rotate: number;
  batch: string | null;
}

export type ComputedValue = (value: string) => string;

export abstract class SurfaceElement<
  T extends ISurfaceElement = ISurfaceElement,
> implements IEdgelessElement
{
  containedByBounds(_: Bound): boolean {
    throw new Error('Method not implemented.');
  }
  getNearestPoint(_: IVec): IVec {
    throw new Error('Method not implemented.');
  }
  intersectWithLine(_: IVec, _1: IVec): PointLocation[] | null {
    throw new Error('Method not implemented.');
  }
  getRelativePointLocation(_: IVec): PointLocation {
    throw new Error('Method not implemented.');
  }
  boxSelect(bound: Bound): boolean {
    return (
      this.containedByBounds(bound) ||
      bound.points.some((point, i, points) =>
        this.intersectWithLine(point, points[(i + 1) % points.length])
      )
    );
  }

  yMap: Y.Map<unknown>;

  protected options: {
    onElementUpdated: (update: {
      id: string;
      props: Record<string, unknown>;
    }) => void;
    pickById: (id: string) => EdgelessElement | null;
    getGroupParent: (element: string | EdgelessElement) => GroupElement;
    setGroupParent: (element: string, group: GroupElement) => void;
    removeElement: (id: string) => void;
    selectionManager?: EdgelessSelectionManager;
  };
  protected renderer: Renderer | null = null;
  protected _connectable = true;
  protected _stashedValues: Map<string, unknown> = new Map();
  protected _localProps: string[] = ['display', 'opacity'];

  computedValue: ComputedValue = v => v;

  constructor(
    yMap: Y.Map<unknown>,
    options: SurfaceElement['options'],
    data: Partial<T> = {}
  ) {
    if (!yMap.doc) {
      throw new Error('yMap must be bound to a Y.Doc');
    }

    this.yMap = yMap;
    for (const key in data) {
      this.yMap.set(key, data[key] as T[keyof T]);
    }

    this.options = options;
  }

  init() {}

  get display() {
    return (this._stashedValues.get('display') as boolean) ?? true;
  }

  set display(val: boolean) {
    this._stashedValues.set('display', val);
  }

  get opacity() {
    return (this._stashedValues.get('opacity') as number) ?? 1;
  }

  set opacity(val: number) {
    this._stashedValues.set('opacity', val);
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
    const xywh = this._stashedValues.has('xywh')
      ? (this._stashedValues.get('xywh') as T['xywh'])
      : (this.yMap.get('xywh') as T['xywh']);
    return xywh;
  }

  get seed() {
    const seed = this.yMap.get('seed') as T['seed'];
    return seed;
  }

  get rotate() {
    const rotate = this.yMap.get('rotate') as T['rotate'];
    return rotate ?? 0;
  }

  get batch() {
    return (this.yMap.get('batch') as T['batch']) ?? null;
  }

  get elementBound() {
    if (this.rotate) {
      return Bound.from(getBoundsWithRotation(this));
    }
    return Bound.deserialize(this.xywh);
  }

  get x() {
    const [x] = this.deserializeXYWH();
    return x;
  }

  get y() {
    const [, y] = this.deserializeXYWH();
    return y;
  }

  get w() {
    const [, , w] = this.deserializeXYWH();
    return w;
  }

  get h() {
    const [, , , h] = this.deserializeXYWH();
    return h;
  }

  get connectable() {
    return this._connectable;
  }

  applyUpdate(updates: Partial<T>) {
    for (const key in updates) {
      if (this._stashedValues.has(key)) {
        this._stashedValues.set(key, updates[key] as T[keyof T]);
        this.options.onElementUpdated({
          id: this.id,
          props: { [key]: updates[key] },
        });
      } else {
        this.yMap.set(key, updates[key] as T[keyof T]);
      }
    }
  }

  deserializeXYWH(): XYWH {
    return deserializeXYWH(this.xywh);
  }

  serialize(): T {
    return this.yMap.toJSON() as T;
  }

  hitTest(x: number, y: number, _options?: HitTestOptions) {
    return isPointIn(this, x, y);
  }

  private _onMap = (events: Y.YEvent<Y.Map<unknown>>[]) => {
    this.renderer?.removeElement(this);
    this.renderer?.addElement(this);
    const e = events[0] as Y.YMapEvent<Y.Map<unknown>>;
    const props: Record<string, unknown> = {};
    e.changes.keys.forEach((_, key) => {
      props[key] = this.yMap.get(key);
    });
    this.options.onElementUpdated({
      id: this.id,
      props: props,
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

  render(_ctx: CanvasRenderingContext2D, _matrix: DOMMatrix, _rc: RoughCanvas) {
    return;
  }

  stash(key: string) {
    this._stashedValues.set(key, this.yMap.get(key));
  }

  pop(key: string) {
    if (this._localProps.includes(key)) return;

    const value = this._stashedValues.get(key);

    if (value) {
      this.yMap.set(key, value);
    }

    this._stashedValues.delete(key);
  }
}
