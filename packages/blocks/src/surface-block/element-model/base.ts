import type { EditorHost } from '@blocksuite/lit';
import { type Y } from '@blocksuite/store';

import type {
  HitTestOptions,
  IEdgelessElement,
} from '../../page-block/edgeless/type.js';
import { randomSeed } from '../rough/math.js';
import type { SurfaceBlockModel } from '../surface-model.js';
import { Bound } from '../utils/bound.js';
import {
  getBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  isPointIn,
  linePolygonIntersects,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
} from '../utils/math-utils.js';
import { PointLocation } from '../utils/point-location.js';
import type { IVec } from '../utils/vec.js';
import { deserializeXYWH, type SerializedXYWH } from '../utils/xywh.js';
import { local, updateDerivedProp, yfield } from './decorators.js';

export type BaseProps = {
  index: string;
  seed: number;
};

export abstract class ElementModel<Props extends BaseProps = BaseProps>
  implements IEdgelessElement
{
  static propsToY(props: Record<string, unknown>) {
    return props;
  }

  /**
   * When the ymap is not connected to the doc, the value cannot be accessed.
   * But sometimes we need to access the value when creating the element model, those temporary values are stored here.
   */
  protected _preserved: Map<string, unknown> = new Map();
  protected _stashed: Map<keyof Props | string, unknown>;
  protected _local: Map<string | symbol, unknown> = new Map();
  protected _onChange: (props: Record<string, { oldValue: unknown }>) => void;

  yMap: Y.Map<unknown>;
  surfaceModel!: SurfaceBlockModel;

  abstract rotate: number;

  abstract xywh: SerializedXYWH;

  abstract get type(): string;

  @yfield()
  index!: string;

  @yfield()
  seed!: number;

  @local()
  display: boolean = true;

  @local()
  opacity: number = 1;

  constructor(options: {
    yMap: Y.Map<unknown>;
    model: SurfaceBlockModel;
    stashedStore: Map<unknown, unknown>;
    onChange: (props: Record<string, { oldValue: unknown }>) => void;
  }) {
    const { yMap, model, stashedStore, onChange } = options;

    this.yMap = yMap;
    this.surfaceModel = model;
    this._stashed = stashedStore as Map<keyof Props, unknown>;
    this._onChange = onChange;

    // base class property field is assigned before yMap is set
    // so we need to manually assign the default value here
    this.index = 'a0';
    this.seed = randomSeed();
  }

  get connectable() {
    return true;
  }

  get deserializedXYWH() {
    return deserializeXYWH(this.xywh);
  }

  get x() {
    return this.deserializedXYWH[0];
  }

  get y() {
    return this.deserializedXYWH[1];
  }

  get w() {
    return this.deserializedXYWH[2];
  }

  get h() {
    return this.deserializedXYWH[3];
  }

  get group() {
    return this.surfaceModel.getGroup(this.id);
  }

  get groups() {
    return this.surfaceModel.getGroups(this.id);
  }

  get id() {
    return this.yMap.get('id') as string;
  }

  get elementBound() {
    if (this.rotate) {
      return Bound.from(getBoundsWithRotation(this));
    }

    return Bound.deserialize(this.xywh);
  }

  stash(prop: keyof Props | string) {
    if (this._stashed.has(prop)) {
      return;
    }

    const curVal = this.yMap.get(prop as string);
    const prototype = Object.getPrototypeOf(this);

    this._stashed.set(prop, curVal);

    Object.defineProperty(this, prop, {
      configurable: true,
      enumerable: true,
      get: () => this._stashed.get(prop),
      set: (value: unknown) => {
        const oldValue = this._stashed.get(prop);

        this._stashed.set(prop, value);
        this._onChange({ [prop]: { oldValue } });

        updateDerivedProp(prototype, prop as string, this);
      },
    });
  }

  pop(prop: keyof Props | string) {
    if (!this._stashed.has(prop)) {
      return;
    }

    const value = this._stashed.get(prop);
    this._stashed.delete(prop);
    // @ts-ignore
    delete this[prop];
    this.yMap.set(prop as string, value);
  }

  containedByBounds(bounds: Bound): boolean {
    return getPointsFromBoundsWithRotation(this).some(point =>
      bounds.containsPoint(point)
    );
  }

  getNearestPoint(point: IVec) {
    const points = getPointsFromBoundsWithRotation(this);
    return polygonNearestPoint(points, point);
  }

  intersectWithLine(start: IVec, end: IVec) {
    const points = getPointsFromBoundsWithRotation(this);
    return linePolygonIntersects(start, end, points);
  }

  getRelativePointLocation(relativePoint: IVec) {
    const bound = Bound.deserialize(this.xywh);
    const point = bound.getRelativePoint(relativePoint);
    const rotatePoint = rotatePoints([point], bound.center, this.rotate)[0];
    const points = rotatePoints(bound.points, bound.center, this.rotate);
    const tangent = polygonGetPointTangent(points, rotatePoint);
    return new PointLocation(rotatePoint, tangent);
  }

  boxSelect(bound: Bound): boolean {
    return (
      this.containedByBounds(bound) ||
      bound.points.some((point, i, points) =>
        this.intersectWithLine(point, points[(i + 1) % points.length])
      )
    );
  }

  hitTest(x: number, y: number, _: HitTestOptions, __?: EditorHost): boolean {
    return isPointIn(this, x, y);
  }

  serialize() {
    return this.yMap.toJSON();
  }
}
