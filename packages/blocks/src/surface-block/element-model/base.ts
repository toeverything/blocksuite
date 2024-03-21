import type { EditorHost } from '@blocksuite/block-std';
import { DisposableGroup } from '@blocksuite/global/utils';
import { type Y } from '@blocksuite/store';

import type {
  HitTestOptions,
  IEdgelessElement,
} from '../../root-block/edgeless/type.js';
import { randomSeed } from '../rough/math.js';
import type { SurfaceBlockModel } from '../surface-model.js';
import { Bound } from '../utils/bound.js';
import {
  getBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
} from '../utils/math-utils.js';
import { PointLocation } from '../utils/point-location.js';
import type { IVec } from '../utils/vec.js';
import {
  deserializeXYWH,
  type SerializedXYWH,
  type XYWH,
} from '../utils/xywh.js';
import {
  convertProps,
  getDeriveProperties,
  local,
  updateDerivedProp,
  watch,
  yfield,
} from './decorators.js';
import type { OmitFunctionsAndKeysAndReadOnly } from './utility-type.js';

export type ModelToProps<
  T extends ElementModel,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  K extends keyof any,
> = OmitFunctionsAndKeysAndReadOnly<
  T,
  K | 'yMap' | 'surface' | 'display' | 'opacity' | 'externalXYWH'
>;

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
   * When the ymap is not connected to the doc, its value cannot be read.
   * But we need to use those value during the creation, so the yfied decorated field's value will
   * be stored in this map too during the creation.
   *
   * After the ymap is connected to the doc, this map will be cleared.
   */
  protected _preserved: Map<string, unknown> = new Map();
  protected _stashed: Map<keyof Props | string, unknown>;
  protected _local: Map<string | symbol, unknown> = new Map();
  protected _onChange: (payload: {
    props: Record<string, unknown>;
    oldValues: Record<string, unknown>;
  }) => void;
  protected _disposable = new DisposableGroup();

  yMap: Y.Map<unknown>;
  surface!: SurfaceBlockModel;

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

  @watch((_, instance) => {
    instance['_local'].delete('externalBound');
  })
  @local()
  externalXYWH: SerializedXYWH | undefined = undefined;

  get externalBound(): Bound | null {
    if (!this._local.has('externalBound')) {
      const bound = this.externalXYWH
        ? Bound.deserialize(this.externalXYWH)
        : null;

      this._local.set('externalBound', bound);
    }

    return this._local.get('externalBound') as Bound | null;
  }

  constructor(options: {
    yMap: Y.Map<unknown>;
    model: SurfaceBlockModel;
    stashedStore: Map<unknown, unknown>;
    onChange: (payload: {
      props: Record<string, unknown>;
      oldValues: Record<string, unknown>;
    }) => void;
  }) {
    const { yMap, model, stashedStore, onChange } = options;

    this.yMap = yMap;
    this.surface = model;
    this._stashed = stashedStore as Map<keyof Props, unknown>;
    this._onChange = onChange;

    // base class properties is initialized before yMap has been set
    // so we need to manually assign the default value here
    this.index = 'a0';
    this.seed = randomSeed();
  }

  get connectable() {
    return true;
  }

  private _lastXYWH: SerializedXYWH = '[0,0,0,0]';

  get deserializedXYWH() {
    if (this.xywh !== this._lastXYWH) {
      const xywh = this.xywh;
      this._local.set('deserializedXYWH', deserializeXYWH(xywh));
      this._lastXYWH = xywh;
    }

    return this._local.get('deserializedXYWH') as XYWH;
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
    return this.surface.getGroup(this.id);
  }

  get groups() {
    return this.surface.getGroups(this.id);
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

    const curVal = this[prop as unknown as keyof ElementModel];
    const prototype = Object.getPrototypeOf(this);

    this._stashed.set(prop, curVal);

    Object.defineProperty(this, prop, {
      configurable: true,
      enumerable: true,
      get: () => this._stashed.get(prop),
      set: (original: unknown) => {
        const value = convertProps(prototype, prop as string, original, this);
        const oldValue = this._stashed.get(prop);
        const derivedProps = getDeriveProperties(
          prototype,
          prop as string,
          original,
          this
        );

        this._stashed.set(prop, value);
        this._onChange({
          props: {
            [prop]: value,
          },
          oldValues: {
            [prop]: oldValue,
          },
        });

        updateDerivedProp(derivedProps, this as unknown as ElementModel);
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

    // @ts-ignore
    if (this['_yProps']?.has(prop)) {
      this.surface.doc.transact(() => {
        this.yMap.set(prop as string, value);
      });
    }
    // @ts-ignore
    else if (this['_localProps']?.has(prop)) {
      this._local.set(prop as string, value);
    } else {
      console.warn('pop a prop that is not yfield or local:', prop);
    }
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

  hitTest(x: number, y: number, _: HitTestOptions, __: EditorHost): boolean {
    return this.elementBound.isPointInBound([x, y]);
  }

  serialize() {
    return this.yMap.toJSON();
  }
}
