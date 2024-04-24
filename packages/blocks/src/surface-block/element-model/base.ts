import type { EditorHost } from '@blocksuite/block-std';
import { DisposableGroup } from '@blocksuite/global/utils';
import { type Y } from '@blocksuite/store';

import type {
  EdgelessBlockModel,
  EdgelessModel,
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
  getYFieldPropsSet,
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
    local: boolean;
  }) => void;
  protected _disposable = new DisposableGroup();
  protected _id: string;

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
    id: string;
    yMap: Y.Map<unknown>;
    model: SurfaceBlockModel;
    stashedStore: Map<unknown, unknown>;
    onChange: (payload: {
      props: Record<string, unknown>;
      oldValues: Record<string, unknown>;
      local: boolean;
    }) => void;
  }) {
    const { id, yMap, model, stashedStore, onChange } = options;

    this._id = id;
    this.yMap = yMap;
    this.surface = model;
    this._stashed = stashedStore as Map<keyof Props, unknown>;
    this._onChange = onChange;

    // class properties is initialized before yMap has been set
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

    return (this._local.get('deserializedXYWH') as XYWH) ?? [0, 0, 0, 0];
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

  get group(): GroupLikeModel | null {
    return this.surface.getGroup(this.id);
  }

  get groups() {
    return this.surface.getGroups(this.id);
  }

  get id() {
    return this._id;
  }

  get elementBound() {
    if (this.rotate) {
      return Bound.from(getBoundsWithRotation(this));
    }

    return Bound.deserialize(this.xywh);
  }

  get isConnected() {
    return this.surface.hasElementById(this.id);
  }

  stash(prop: keyof Props | string) {
    if (this._stashed.has(prop)) {
      return;
    }

    const prototype = Object.getPrototypeOf(this);

    if (!getYFieldPropsSet(prototype).has(prop as string)) {
      return;
    }

    const curVal = this[prop as unknown as keyof ElementModel];

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
          this as unknown as ElementModel
        );

        this._stashed.set(prop, value);
        this._onChange({
          props: {
            [prop]: value,
          },
          oldValues: {
            [prop]: oldValue,
          },
          local: true,
        });

        this.surface['hooks'].update.emit({
          id: this.id,
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

    const prototype = Object.getPrototypeOf(this);
    const value = this._stashed.get(prop);
    this._stashed.delete(prop);
    // @ts-ignore
    delete this[prop];

    if (getYFieldPropsSet(prototype).has(prop as string)) {
      this.surface.doc.transact(() => {
        // directly set the value to the ymap to avoid
        // executing derive and convert decorators again
        this.yMap.set(prop as string, value);
      });
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

  /**
   * `onCreated` function will be executed when
   * element is created in local rather than remote peers
   */
  onCreated() {}
}

export abstract class GroupLikeModel<
  Props extends BaseProps = BaseProps,
> extends ElementModel<Props> {
  /**
   * The actual field that stores the children of the group.
   * It could be any type you want and this field should be decorated with `@yfield`.
   */
  abstract children: unknown;

  /**
   * The ids of the children. Its role is to provide a unique way to access the children.
   * You should update this field through `setChildIds` when the children are added or removed.
   */
  get childIds() {
    return this._childIds;
  }
  private _childIds: string[] = [];

  /**
   * Set the new value of the childIds
   * @param value the new value of the childIds
   * @param fromLocal if true, the change is happend in the local
   */
  protected setChildIds(value: string[], fromLocal: boolean) {
    const oldChildIds = this.childIds;
    this._childIds = value;

    this._onChange({
      props: {
        childIds: value,
      },
      oldValues: {
        childIds: oldChildIds,
      },
      local: fromLocal,
    });

    this.surface['hooks'].update.emit({
      id: this.id,
      props: {
        childIds: value,
      },
      oldValues: {
        childIds: oldChildIds,
      },
    });
  }

  get childElements() {
    const elements: EdgelessModel[] = [];

    for (const key of this.childIds) {
      const element =
        this.surface.getElementById(key) ||
        (this.surface.doc.getBlockById(key) as EdgelessBlockModel);

      element && elements.push(element);
    }

    return elements;
  }

  @local()
  xywh: SerializedXYWH = '[0,0,0,0]';

  /**
   * Check if the group has the given descendant.
   */
  hasDescendant(element: string | EdgelessModel) {
    const groups =
      typeof element === 'string'
        ? this.surface.getGroups(element)
        : this.surface.getGroups(element.id);

    return groups.some(group => group.id === this.id);
  }

  /**
   * Get all decendants of this group
   * @param withoutGroup if true, will not include group element
   */
  decendants(withoutGroup = true) {
    return this.childElements.reduce((prev, child) => {
      if (child instanceof GroupLikeModel) {
        prev = prev.concat(child.decendants());

        !withoutGroup && prev.push(child);
      } else {
        prev.push(child);
      }

      return prev;
    }, [] as EdgelessModel[]);
  }

  /**
   * Remove the descendant from the group
   */
  abstract removeDescendant(id: string): void;
}

export abstract class LocalModel {
  protected _local: Map<string | symbol, unknown> = new Map();

  abstract rotate: number;

  abstract xywh: SerializedXYWH;

  private _lastXYWH: SerializedXYWH = '[0,0,-1,-1]';

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
}
