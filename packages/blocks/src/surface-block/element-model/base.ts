import type { EditorHost } from '@blocksuite/block-std';
import type { Y } from '@blocksuite/store';

import { DisposableGroup } from '@blocksuite/global/utils';

import type { EdgelessBlockModel } from '../../root-block/edgeless/edgeless-block-model.js';
import type { SurfaceBlockModel } from '../surface-model.js';
import type { IVec } from '../utils/vec.js';
import type { OmitFunctionsAndKeysAndReadOnly } from './utility-type.js';

import { randomSeed } from '../rough/math.js';
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
import {
  type SerializedXYWH,
  type XYWH,
  deserializeXYWH,
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

export type ModelToProps<
  T extends SurfaceElementModel,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  K extends keyof any,
> = OmitFunctionsAndKeysAndReadOnly<
  T,
  'display' | 'externalXYWH' | 'opacity' | 'surface' | 'yMap' | K
>;

export type IBaseProps = {
  index: string;
  seed: number;
};

export interface IHitTestOptions {
  all?: boolean;

  expand?: number;

  /**
   * If true, the transparent area of the element will be ignored during hit test.
   * Otherwise, the transparent area will be considered as filled area.
   *
   * Default is true.
   */
  ignoreTransparent?: boolean;
  zoom?: number;
}

export interface IEdgelessElement {
  boxSelect(bound: Bound): boolean;
  connectable: boolean;
  containedByBounds(bounds: Bound): boolean;
  /**
   * The bound of the element after rotation.
   * The bound without rotation should be created by `Bound.deserialize(this.xywh)`.
   */
  elementBound: Bound;
  externalBound: Bound | null;
  /**
   * In some cases, you need to draw something related to the element, but it does not belong to the element itself.
   * And it is also interactive, you can select element by clicking on it. E.g. the title of the group element.
   * In this case, we need to store this kind of external xywh in order to do hit test. This property should not be synced to the doc.
   * This property should be updated every time it gets rendered.
   */
  externalXYWH: SerializedXYWH | undefined;
  getNearestPoint(point: IVec): IVec;

  getRelativePointLocation(point: IVec): PointLocation;
  group: SurfaceGroupLikeModel<IBaseProps> | null;
  groups: SurfaceGroupLikeModel<IBaseProps>[];
  hitTest(
    x: number,
    y: number,
    options: IHitTestOptions,
    host: EditorHost
  ): boolean;
  id: string;
  index: string;
  intersectWithLine(start: IVec, end: IVec): PointLocation[] | null;
  rotate: number;
  xywh: SerializedXYWH;
}

export type SerializedElement = {
  id: string;
  index: string;
  props: Record<string, unknown>;
  type: string;
  xywh: SerializedXYWH;
} & Record<string, unknown>;

export abstract class SurfaceElementModel<Props extends IBaseProps = IBaseProps>
  implements IEdgelessElement
{
  protected _disposable = new DisposableGroup();

  protected _id: string;

  private _lastXYWH: SerializedXYWH = '[0,0,0,0]';

  protected _local = new Map<string | symbol, unknown>();

  protected _onChange: (payload: {
    local: boolean;
    oldValues: Record<string, unknown>;
    props: Record<string, unknown>;
  }) => void;

  /**
   * When the ymap is not connected to the doc, its value cannot be read.
   * But we need to use those value during the creation, so the yfield decorated field's value will
   * be stored in this map too during the creation.
   *
   * After the ymap is connected to the doc, this map will be cleared.
   */
  protected _preserved = new Map<string, unknown>();

  protected _stashed: Map<keyof Props | string, unknown>;

  surface!: SurfaceBlockModel;

  yMap: Y.Map<unknown>;

  constructor(options: {
    id: string;
    model: SurfaceBlockModel;
    onChange: (payload: {
      local: boolean;
      oldValues: Record<string, unknown>;
      props: Record<string, unknown>;
    }) => void;
    stashedStore: Map<unknown, unknown>;
    yMap: Y.Map<unknown>;
  }) {
    const { id, model, onChange, stashedStore, yMap } = options;

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

  static propsToY(props: Record<string, unknown>) {
    return props;
  }

  boxSelect(bound: Bound): boolean {
    return (
      this.containedByBounds(bound) ||
      bound.points.some((point, i, points) =>
        this.intersectWithLine(point, points[(i + 1) % points.length])
      )
    );
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

  getRelativePointLocation(relativePoint: IVec) {
    const bound = Bound.deserialize(this.xywh);
    const point = bound.getRelativePoint(relativePoint);
    const rotatePoint = rotatePoints([point], bound.center, this.rotate)[0];
    const points = rotatePoints(bound.points, bound.center, this.rotate);
    const tangent = polygonGetPointTangent(points, rotatePoint);
    return new PointLocation(rotatePoint, tangent);
  }

  hitTest(x: number, y: number, _: IHitTestOptions, __: EditorHost): boolean {
    return this.elementBound.isPointInBound([x, y]);
  }

  intersectWithLine(start: IVec, end: IVec) {
    const points = getPointsFromBoundsWithRotation(this);
    return linePolygonIntersects(start, end, points);
  }

  /**
   * `onCreated` function will be executed when
   * element is created in local rather than remote peers
   */
  onCreated() {}

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

  serialize() {
    return this.yMap.toJSON() as SerializedElement;
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
          local: true,
          oldValues: {
            [prop]: oldValue,
          },
          props: {
            [prop]: value,
          },
        });

        this.surface['hooks'].update.emit({
          id: this.id,
          oldValues: {
            [prop]: oldValue,
          },
          props: {
            [prop]: value,
          },
        });

        updateDerivedProp(derivedProps, this as unknown as SurfaceElementModel);
      },
    });
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

  get elementBound() {
    if (this.rotate) {
      return Bound.from(getBoundsWithRotation(this));
    }

    return Bound.deserialize(this.xywh);
  }

  get externalBound(): Bound | null {
    if (!this._local.has('externalBound')) {
      const bound = this.externalXYWH
        ? Bound.deserialize(this.externalXYWH)
        : null;

      this._local.set('externalBound', bound);
    }

    return this._local.get('externalBound') as Bound | null;
  }

  get group(): SurfaceGroupLikeModel | null {
    return this.surface.getGroup(this.id);
  }

  get groups() {
    return this.surface.getGroups(this.id);
  }

  get h() {
    return this.deserializedXYWH[3];
  }

  get id() {
    return this._id;
  }

  get isConnected() {
    return this.surface.hasElementById(this.id);
  }

  get w() {
    return this.deserializedXYWH[2];
  }

  get x() {
    return this.deserializedXYWH[0];
  }

  get y() {
    return this.deserializedXYWH[1];
  }

  @local()
  accessor display: boolean = true;

  @watch((_, instance) => {
    instance['_local'].delete('externalBound');
  })
  @local()
  accessor externalXYWH: SerializedXYWH | undefined = undefined;

  @yfield()
  accessor index!: string;

  @local()
  accessor opacity: number = 1;

  abstract rotate: number;

  @yfield()
  accessor seed!: number;

  abstract get type(): string;

  abstract xywh: SerializedXYWH;
}

export abstract class SurfaceGroupLikeModel<
  Props extends IBaseProps = IBaseProps,
> extends SurfaceElementModel<Props> {
  private _childIds: string[] = [];

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

  hasChild(element: BlockSuite.EdgelessModelType | string) {
    return (
      (typeof element === 'string'
        ? this.children?.has(element)
        : this.children?.has(element.id)) ?? false
    );
  }

  /**
   * The actual field that stores the children of the group.
   * It should be a ymap decorated with `@yfield`.
   */
  /**
   * Check if the group has the given descendant.
   */
  hasDescendant(element: BlockSuite.EdgelessModelType | string) {
    const groups = this.surface.getGroups(
      typeof element === 'string' ? element : element.id
    );

    return groups.some(group => group.id === this.id);
  }

  /**
   * Set the new value of the childIds
   * @param value the new value of the childIds
   * @param fromLocal if true, the change is happened in the local
   */
  protected setChildIds(value: string[], fromLocal: boolean) {
    const oldChildIds = this.childIds;
    this._childIds = value;

    this._onChange({
      local: fromLocal,
      oldValues: {
        childIds: oldChildIds,
      },
      props: {
        childIds: value,
      },
    });

    this.surface['hooks'].update.emit({
      id: this.id,
      oldValues: {
        childIds: oldChildIds,
      },
      props: {
        childIds: value,
      },
    });
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

  /**
   * The ids of the children. Its role is to provide a unique way to access the children.
   * You should update this field through `setChildIds` when the children are added or removed.
   */
  get childIds() {
    return this._childIds;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract children: Y.Map<any>;

  /**
   * Remove the child from the group
   */
  abstract removeChild(id: string): void;

  @local<SerializedXYWH, SurfaceGroupLikeModel>()
  accessor xywh: SerializedXYWH = '[0,0,0,0]';
}

export abstract class SurfaceLocalModel {
  private _lastXYWH: SerializedXYWH = '[0,0,-1,-1]';

  protected _local = new Map<string | symbol, unknown>();

  opacity: number = 1;

  get deserializedXYWH() {
    if (this.xywh !== this._lastXYWH) {
      const xywh = this.xywh;
      this._local.set('deserializedXYWH', deserializeXYWH(xywh));
      this._lastXYWH = xywh;
    }

    return this._local.get('deserializedXYWH') as XYWH;
  }

  get h() {
    return this.deserializedXYWH[3];
  }

  get w() {
    return this.deserializedXYWH[2];
  }

  get x() {
    return this.deserializedXYWH[0];
  }

  get y() {
    return this.deserializedXYWH[1];
  }

  abstract rotate: number;

  abstract xywh: SerializedXYWH;
}

declare global {
  namespace BlockSuite {
    interface SurfaceElementModelMap {}
    type SurfaceElementModelKeyType = keyof SurfaceElementModelMap;
    type SurfaceElementModelType =
      | SurfaceElementModel
      | SurfaceElementModelMap[SurfaceElementModelKeyType];

    interface SurfaceGroupLikeModelMap {}
    type SurfaceGroupLikeModelKeyType = keyof SurfaceGroupLikeModelMap;
    type SurfaceGroupLikeModelType =
      | SurfaceGroupLikeModel
      | SurfaceGroupLikeModelMap[SurfaceGroupLikeModelKeyType];

    interface SurfaceLocalModelMap {}
    type SurfaceLocalModelKeyType = keyof SurfaceLocalModelMap;
    type SurfaceLocalModelType =
      | SurfaceLocalModel
      | SurfaceLocalModelMap[SurfaceLocalModelKeyType];

    // not include local model
    type SurfaceModelType = SurfaceElementModelType | SurfaceGroupLikeModelType;
    type SurfaceModelKeyType =
      | SurfaceElementModelKeyType
      | SurfaceGroupLikeModelKeyType;
  }
}
