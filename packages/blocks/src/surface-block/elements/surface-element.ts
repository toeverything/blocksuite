import type { Y } from '@blocksuite/store';

import type {
  CanvasElementLocalRecordValues,
  EdgelessElement,
  GroupElement,
} from '../../index.js';
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

export interface ISurfaceElementLocalRecord {
  display?: boolean;
  opacity?: number;
  xywh?: SerializedXYWH;
}

export type ComputedValue = (value: string) => string;

export abstract class SurfaceElement<
  T extends ISurfaceElement = ISurfaceElement,
  L extends ISurfaceElementLocalRecord = ISurfaceElementLocalRecord,
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
    getLocalRecord: (id: string) => CanvasElementLocalRecordValues | undefined;
    onElementUpdated: (update: {
      id: string;
      props: Record<string, unknown>;
    }) => void;
    updateElementLocalRecord: (
      id: string,
      record: Record<string, unknown>
    ) => void;
    pickById: (id: string) => EdgelessElement | null;
    getGroupParent: (element: string | EdgelessElement) => GroupElement;
    setGroupParent: (
      element: string | EdgelessElement,
      group: GroupElement
    ) => void;
    selectionManager?: EdgelessSelectionManager;
  };
  protected renderer: Renderer | null = null;
  protected _connectable = true;

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
    const xywh = this.localRecord?.xywh ?? (this.yMap.get('xywh') as T['xywh']);
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

  get gridBound() {
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

  get localRecord() {
    return this.options.getLocalRecord(this.id);
  }

  get connectable() {
    return this._connectable;
  }

  getLocalRecord(): L {
    return this.options.getLocalRecord(this.id) as L;
  }

  applyUpdate(updates: Partial<T>) {
    for (const key in updates) {
      this.yMap.set(key, updates[key] as T[keyof T]);
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
}
