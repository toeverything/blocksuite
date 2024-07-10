import type { EditorHost } from '@blocksuite/block-std';
import { DisposableGroup } from '@blocksuite/global/utils';
import type { Y } from '@blocksuite/store';

import type { EdgelessBlockModel } from '../../root-block/edgeless/edgeless-block-model.js';
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
  T extends SurfaceElementModel,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  K extends keyof any,
> = OmitFunctionsAndKeysAndReadOnly<
  T,
  K | 'yMap' | 'surface' | 'display' | 'opacity' | 'externalXYWH'
>;

export type IBaseProps = {
  index: string;
  seed: number;
};

export interface IHitTestOptions {
  expand?: number;

  /**
   * If true, the transparent area of the element will be ignored during hit test.
   * Otherwise, the transparent area will be considered as filled area.
   *
   * Default is true.
   */
  ignoreTransparent?: boolean;

  all?: boolean;
  zoom?: number;
}

export interface IEdgelessElement {
  id: string;
  xywh: SerializedXYWH;
  /**
   * In some cases, you need to draw something related to the element, but it does not belong to the element itself.
   * And it is also interactive, you can select element by clicking on it. E.g. the title of the group element.
   * In this case, we need to store this kind of external xywh in order to do hit test. This property should not be synced to the doc.
   * This property should be updated every time it gets rendered.
   */
  externalXYWH: SerializedXYWH | undefined;
  externalBound: Bound | null;
  rotate: number;
  connectable: boolean;
  index: string;

  /**
   * The bound of the element after rotation.
   * The bound without rotation should be created by `Bound.deserialize(this.xywh)`.
   */
  elementBound: Bound;
  group: SurfaceGroupLikeModel<IBaseProps> | null;
  groups: SurfaceGroupLikeModel<IBaseProps>[];
  containedByBounds(bounds: Bound): boolean;
  getNearestPoint(point: IVec): IVec;
  intersectWithLine(start: IVec, end: IVec): PointLocation[] | null;
  getRelativePointLocation(point: IVec): PointLocation;
  hitTest(
    x: number,
    y: number,
    options: IHitTestOptions,
    host: EditorHost
  ): boolean;
  boxSelect(bound: Bound): boolean;
}

export type SerializedElement = Record<string, unknown> & {
  type: string;
  xywh: SerializedXYWH;
  id: string;
  index: string;
  props: Record<string, unknown>;
};

export abstract class SurfaceElementModel<Props extends IBaseProps = IBaseProps>
  implements IEdgelessElement
{
  abstract get type(): string;

  get externalBound(): Bound | null {
    if (!this._local.has('externalBound')) {
      const bound = this.externalXYWH
        ? Bound.deserialize(this.externalXYWH)
        : null;

      this._local.set('externalBound', bound);
    }

    return this._local.get('externalBound') as Bound | null;
  }

  get connectable() {
    return true;
  }

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

  get group(): SurfaceGroupLikeModel | null {
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

  private _lastXYWH: SerializedXYWH = '[0,0,0,0]';

  /**
   * When the ymap is not connected to the doc, its value cannot be read.
   * But we need to use those value during the creation, so the yfield decorated field's value will
   * be stored in this map too during the creation.
   *
   * After the ymap is connected to the doc, this map will be cleared.
   */
  protected _preserved = new Map<string, unknown>();

  protected _stashed: Map<keyof Props | string, unknown>;

  protected _local = new Map<string | symbol, unknown>();

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

  @yfield()
  accessor index!: string;

  @yfield()
  accessor seed!: number;

  @local()
  accessor display: boolean = true;

  @local()
  accessor opacity: number = 1;

  @watch((_, instance) => {
    instance['_local'].delete('externalBound');
  })
  @local()
  accessor externalXYWH: SerializedXYWH | undefined = undefined;

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

  stash(prop: keyof Props | string) {
    if (this._stashed.has(prop)) {
      return;
    }

    if (!getYFieldPropsSet(this).has(prop as string)) {
      return;
    }

    const curVal = this[prop as unknown as keyof SurfaceElementModel];

    this._stashed.set(prop, curVal);

    Object.defineProperty(this, prop, {
      configurable: true,
      enumerable: true,
      get: () => this._stashed.get(prop),
      set: (original: unknown) => {
        const value = convertProps(prop as string, original, this);
        const oldValue = this._stashed.get(prop);
        const derivedProps = getDeriveProperties(
          prop as string,
          original,
          this as unknown as SurfaceElementModel
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

        updateDerivedProp(derivedProps, this as unknown as SurfaceElementModel);
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

    if (getYFieldPropsSet(this).has(prop as string)) {
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

  hitTest(x: number, y: number, _: IHitTestOptions, __: EditorHost): boolean {
    return this.elementBound.isPointInBound([x, y]);
  }

  serialize() {
    return this.yMap.toJSON() as SerializedElement;
  }

  /**
   * `onCreated` function will be executed when
   * element is created in local rather than remote peers
   */
  onCreated() {}

  static propsToY(props: Record<string, unknown>) {
    return props;
  }
}

export abstract class SurfaceGroupLikeModel<
  Props extends IBaseProps = IBaseProps,
> extends SurfaceElementModel<Props> {
  /**
   * The ids of the children. Its role is to provide a unique way to access the children.
   * You should update this field through `setChildIds` when the children are added or removed.
   */
  get childIds() {
    return this._childIds;
  }

  get childElements() {
    const elements: BlockSuite.EdgelessModelType[] = [];

    for (const key of this.childIds) {
      const element =
        this.surface.getElementById(key) ||
        (this.surface.doc.getBlockById(key) as EdgelessBlockModel);

      element && elements.push(element);
    }

    return elements;
  }

  private _childIds: string[] = [];

  /**
   * The actual field that stores the children of the group.
   * It should be a ymap decorated with `@yfield`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract children: Y.Map<any>;

  @local<SerializedXYWH, SurfaceGroupLikeModel>()
  accessor xywh: SerializedXYWH = '[0,0,0,0]';

  /**
   * Set the new value of the childIds
   * @param value the new value of the childIds
   * @param fromLocal if true, the change is happened in the local
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

  hasChild(element: string | BlockSuite.EdgelessModelType) {
    return (
      (typeof element === 'string'
        ? this.children?.has(element)
        : this.children?.has(element.id)) ?? false
    );
  }

  /**
   * Check if the group has the given descendant.
   */
  hasDescendant(element: string | BlockSuite.EdgelessModelType) {
    const groups = this.surface.getGroups(
      typeof element === 'string' ? element : element.id
    );

    return groups.some(group => group.id === this.id);
  }

  /**
   * Get all descendants of this group
   * @param withoutGroup if true, will not include group element
   */
  descendants(withoutGroup = true) {
    return this.childElements.reduce((prev, child) => {
      if (child instanceof SurfaceGroupLikeModel) {
        prev = prev.concat(child.descendants());

        !withoutGroup && prev.push(child);
      } else {
        prev.push(child);
      }

      return prev;
    }, [] as BlockSuite.EdgelessModelType[]);
  }

  /**
   * Remove the child from the group
   */
  abstract removeChild(id: string): void;
}

export abstract class SurfaceLocalModel {
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

  private _lastXYWH: SerializedXYWH = '[0,0,-1,-1]';

  protected _local = new Map<string | symbol, unknown>();

  abstract rotate: number;

  abstract xywh: SerializedXYWH;

  opacity: number = 1;
}

declare global {
  namespace BlockSuite {
    interface SurfaceElementModelMap {}
    type SurfaceElementModelKeyType = keyof SurfaceElementModelMap;
    type SurfaceElementModelType =
      | SurfaceElementModelMap[SurfaceElementModelKeyType]
      | SurfaceElementModel;

    interface SurfaceGroupLikeModelMap {}
    type SurfaceGroupLikeModelKeyType = keyof SurfaceGroupLikeModelMap;
    type SurfaceGroupLikeModelType =
      | SurfaceGroupLikeModelMap[SurfaceGroupLikeModelKeyType]
      | SurfaceGroupLikeModel;

    interface SurfaceLocalModelMap {}
    type SurfaceLocalModelKeyType = keyof SurfaceLocalModelMap;
    type SurfaceLocalModelType =
      | SurfaceLocalModelMap[SurfaceLocalModelKeyType]
      | SurfaceLocalModel;

    // not include local model
    type SurfaceModelType = SurfaceElementModelType | SurfaceGroupLikeModelType;
    type SurfaceModelKeyType =
      | SurfaceElementModelKeyType
      | SurfaceGroupLikeModelKeyType;
  }
}
