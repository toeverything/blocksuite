import type { IVec, SerializedXYWH, XYWH } from '@blocksuite/global/utils';

import {
  Bound,
  deserializeXYWH,
  DisposableGroup,
  getBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  PointLocation,
  polygonGetPointTangent,
  polygonNearestPoint,
  randomSeed,
  rotatePoints,
} from '@blocksuite/global/utils';
import { DocCollection, type Y } from '@blocksuite/store';
import { createMutex } from 'lib0/mutex';

import type { EditorHost } from '../../view/index.js';
import type { GfxBlockElementModel, GfxModel } from '../gfx-block-model.js';
import type { SurfaceBlockModel } from './surface-model.js';

import {
  convertProps,
  field,
  getDerivedProps,
  getFieldPropsSet,
  local,
  updateDerivedProps,
  watch,
} from './decorators/index.js';

export type BaseElementProps = {
  index: string;
  seed: number;
};

export type GfxCompatibleProps = {
  xywh: SerializedXYWH;
  index: string;
};

export type SerializedElement = Record<string, unknown> & {
  type: string;
  xywh: SerializedXYWH;
  id: string;
  index: string;
  props: Record<string, unknown>;
};

export interface PointTestOptions {
  /**
   * The threshold of the hit test. The unit is pixel.
   */
  hitThreshold?: number;

  /**
   * The padding of the response area for each element when do the hit testing. The unit is pixel.
   */
  responsePadding?: [number, number];

  /**
   * If true, the transparent area of the element will be ignored during the point inclusion test.
   * Otherwise, the transparent area will be considered as filled area.
   *
   * Default is true.
   */
  ignoreTransparent?: boolean;

  zoom?: number;
}

export interface GfxElementGeometry {
  containsBound(bound: Bound): boolean;
  getNearestPoint(point: IVec): IVec;
  getLineIntersections(start: IVec, end: IVec): PointLocation[] | null;
  getRelativePointLocation(point: IVec): PointLocation;
  includesPoint(
    x: number,
    y: number,
    options: PointTestOptions,
    host: EditorHost
  ): boolean;
  intersectsBound(bound: Bound): boolean;
}

export const gfxContainerSymbol = Symbol('GfxContainerElement');

export const isGfxContainerElm = (elm: unknown): elm is GfxContainerElement => {
  return (elm as GfxContainerElement)[gfxContainerSymbol] === true;
};

export interface GfxContainerElement extends GfxCompatibleProps {
  [gfxContainerSymbol]: true;
  childIds: string[];
  childElements: GfxModel[];
  hasDescendant(element: string | GfxModel): boolean;
}

export abstract class GfxPrimitiveElementModel<
  Props extends BaseElementProps = BaseElementProps,
> implements GfxElementGeometry
{
  private _lastXYWH!: SerializedXYWH;

  protected _disposable = new DisposableGroup();

  protected _id: string;

  protected _local = new Map<string | symbol, unknown>();

  protected _onChange: (payload: {
    props: Record<string, unknown>;
    oldValues: Record<string, unknown>;
    local: boolean;
  }) => void;

  /**
   * Used to store a copy of data in the yMap.
   */
  protected _preserved = new Map<string, unknown>();

  protected _stashed: Map<keyof Props | string, unknown>;

  abstract rotate: number;

  surface!: SurfaceBlockModel;

  abstract xywh: SerializedXYWH;

  yMap: Y.Map<unknown>;

  get connectable() {
    return true;
  }

  get deserializedXYWH() {
    if (!this._lastXYWH || this.xywh !== this._lastXYWH) {
      const xywh = this.xywh;
      this._local.set('deserializedXYWH', deserializeXYWH(xywh));
      this._lastXYWH = xywh;
    }

    return (this._local.get('deserializedXYWH') as XYWH) ?? [0, 0, 0, 0];
  }

  /**
   * The bound of the element after rotation.
   * The bound without rotation should be created by `Bound.deserialize(this.xywh)`.
   */
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

  get group(): GfxGroupLikeElementModel | null {
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

  abstract get type(): string;

  get w() {
    return this.deserializedXYWH[2];
  }

  get x() {
    return this.deserializedXYWH[0];
  }

  get y() {
    return this.deserializedXYWH[1];
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

    this.index = 'a0';
    this.seed = randomSeed();
  }

  static propsToY(props: Record<string, unknown>) {
    return props;
  }

  containsBound(bounds: Bound): boolean {
    return getPointsFromBoundsWithRotation(this).some(point =>
      bounds.containsPoint(point)
    );
  }

  getLineIntersections(start: IVec, end: IVec) {
    const points = getPointsFromBoundsWithRotation(this);
    return linePolygonIntersects(start, end, points);
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

  includesPoint(
    x: number,
    y: number,
    _: PointTestOptions,
    __: EditorHost
  ): boolean {
    return this.elementBound.isPointInBound([x, y]);
  }

  intersectsBound(bound: Bound): boolean {
    return (
      this.containsBound(bound) ||
      bound.points.some((point, i, points) =>
        this.getLineIntersections(point, points[(i + 1) % points.length])
      )
    );
  }

  onCreated() {}

  pop(prop: keyof Props | string) {
    if (!this._stashed.has(prop)) {
      return;
    }

    const value = this._stashed.get(prop);
    this._stashed.delete(prop);
    // @ts-ignore
    delete this[prop];

    if (getFieldPropsSet(this).has(prop as string)) {
      this.surface.doc.transact(() => {
        this.yMap.set(prop as string, value);
      });
    } else {
      console.warn('pop a prop that is not field or local:', prop);
    }
  }

  serialize() {
    const result = this.yMap.toJSON();
    result.xywh = this.xywh;
    return result as SerializedElement;
  }

  stash(prop: keyof Props | string) {
    if (this._stashed.has(prop)) {
      return;
    }

    if (!getFieldPropsSet(this).has(prop as string)) {
      return;
    }

    const curVal = this[prop as unknown as keyof GfxPrimitiveElementModel];

    this._stashed.set(prop, curVal);

    Object.defineProperty(this, prop, {
      configurable: true,
      enumerable: true,
      get: () => this._stashed.get(prop),
      set: (original: unknown) => {
        const value = convertProps(prop as string, original, this);
        const oldValue = this._stashed.get(prop);
        const derivedProps = getDerivedProps(
          prop as string,
          original,
          this as unknown as GfxPrimitiveElementModel
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

        updateDerivedProps(
          derivedProps,
          this as unknown as GfxPrimitiveElementModel
        );
      },
    });
  }

  @local()
  accessor display: boolean = true;

  @watch((_, instance) => {
    instance['_local'].delete('externalBound');
  })

  /**
   * In some cases, you need to draw something related to the element, but it does not belong to the element itself.
   * And it is also interactive, you can select element by clicking on it. E.g. the title of the group element.
   * In this case, we need to store this kind of external xywh in order to do hit test. This property should not be synced to the doc.
   * This property should be updated every time it gets rendered.
   */
  @local()
  accessor externalXYWH: SerializedXYWH | undefined = undefined;

  @field()
  accessor index!: string;

  @local()
  accessor opacity: number = 1;

  @field()
  accessor seed!: number;
}

export abstract class GfxGroupLikeElementModel<
    Props extends BaseElementProps = BaseElementProps,
  >
  extends GfxPrimitiveElementModel<Props>
  implements GfxContainerElement
{
  private _childBoundCacheKey: string = '';

  private _childIds: string[] = [];

  private _mutex = createMutex();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract children: Y.Map<any>;

  [gfxContainerSymbol] = true as const;

  get childElements() {
    const elements: GfxModel[] = [];

    for (const key of this.childIds) {
      const element =
        this.surface.getElementById(key) ||
        (this.surface.doc.getBlockById(key) as GfxBlockElementModel);

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

  get xywh() {
    if (
      !this._local.has('xywh') ||
      this.childElements.reduce(
        (pre, model) => pre + (model.xywh ?? ''),
        ''
      ) !== this._childBoundCacheKey
    ) {
      this._mutex(() => {
        this._updateXYWH();
      });
    }

    return (this._local.get('xywh') as SerializedXYWH) ?? '[0,0,0,0]';
  }

  set xywh(_) {}

  private _updateXYWH() {
    let bound: Bound | undefined;
    let cacheKey = '';
    const oldValue = (this._local.get('xywh') as SerializedXYWH) ?? '[0,0,0,0]';

    this.childElements.forEach(child => {
      cacheKey += child.xywh ?? '';
      bound = bound ? bound.unite(child.elementBound) : child.elementBound;
    });

    if (bound) {
      this._local.set('xywh', bound.serialize());
      this._childBoundCacheKey = cacheKey;
    } else {
      this._local.delete('xywh');
      this._childBoundCacheKey = '';
    }

    this._onChange({
      props: {
        xywh: bound?.serialize(),
      },
      oldValues: {
        xywh: oldValue,
      },
      local: true,
    });
  }

  /**
   * @deprecated Use `getAllDescendantElements` instead.
   * Get all descendants of this group
   * @param withoutGroup if true, will not include group element
   */
  descendants(withoutGroup = true) {
    return this.childElements.reduce((prev, child) => {
      if (child instanceof GfxGroupLikeElementModel) {
        prev = prev.concat(child.descendants());

        !withoutGroup && prev.push(child as GfxPrimitiveElementModel);
      } else {
        prev.push(child);
      }

      return prev;
    }, [] as GfxModel[]);
  }

  /**
   * The actual field that stores the children of the group.
   * It should be a ymap decorated with `@field`.
   */
  hasChild(element: string | GfxModel) {
    return (
      (typeof element === 'string'
        ? this.children?.has(element)
        : this.children?.has(element.id)) ?? false
    );
  }

  /**
   * Check if the group has the given descendant.
   */
  hasDescendant(element: string | GfxModel) {
    const groups = this.surface.getGroups(
      typeof element === 'string' ? element : element.id
    );

    return groups.some(group => group.id === this.id);
  }

  /**
   * Remove the child from the group
   */
  abstract removeChild(id: string): void;

  /**
   * Set the new value of the childIds
   * @param value the new value of the childIds
   * @param fromLocal if true, the change is happened in the local
   */
  setChildIds(value: string[], fromLocal: boolean) {
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
}

export abstract class GfxLocalElementModel {
  private _lastXYWH: SerializedXYWH = '[0,0,-1,-1]';

  protected _local = new Map<string | symbol, unknown>();

  opacity: number = 1;

  abstract rotate: number;

  abstract xywh: SerializedXYWH;

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
}

export function syncElementFromY(
  model: GfxPrimitiveElementModel,
  callback: (payload: {
    props: Record<string, unknown>;
    oldValues: Record<string, unknown>;
    local: boolean;
  }) => void
) {
  const disposables: Record<string, () => void> = {};
  const observer = (
    event: Y.YMapEvent<unknown>,
    transaction: Y.Transaction
  ) => {
    const props: Record<string, unknown> = {};
    const oldValues: Record<string, unknown> = {};

    event.keysChanged.forEach(key => {
      const type = event.changes.keys.get(key);
      const oldValue = event.changes.keys.get(key)?.oldValue;

      if (!type) {
        return;
      }

      if (type.action === 'update' || type.action === 'add') {
        const value = model.yMap.get(key);

        if (value instanceof DocCollection.Y.Text) {
          disposables[key]?.();
          disposables[key] = watchText(key, value, callback);
        }

        model['_preserved'].set(key, value);
        props[key] = value;
        oldValues[key] = oldValue;
      }
    });

    callback({
      props,
      oldValues,
      local: transaction.local,
    });
  };

  Array.from(model.yMap.entries()).forEach(([key, value]) => {
    if (value instanceof DocCollection.Y.Text) {
      disposables[key] = watchText(key, value, callback);
    }

    model['_preserved'].set(key, value);
  });

  model.yMap.observe(observer);
  disposables['ymap'] = () => {
    model.yMap.unobserve(observer);
  };

  return () => {
    Object.values(disposables).forEach(fn => fn());
  };
}

function watchText(
  key: string,
  value: Y.Text,
  callback: (payload: {
    props: Record<string, unknown>;
    oldValues: Record<string, unknown>;
    local: boolean;
  }) => void
) {
  const fn = (_: Y.YTextEvent, transaction: Y.Transaction) => {
    callback({
      props: {
        [key]: value,
      },
      oldValues: {},
      local: transaction.local,
    });
  };

  value.observe(fn);

  return () => {
    value.unobserve(fn);
  };
}
