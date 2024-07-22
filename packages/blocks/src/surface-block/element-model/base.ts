import type { EditorHost } from '@blocksuite/block-std';
import type { Node, NodeHitTestOptions } from '@blocksuite/block-std/edgeless';
import type { IVec, SerializedXYWH, XYWH } from '@blocksuite/global/utils';
import type { Y } from '@blocksuite/store';

import { deserializeXYWH } from '@blocksuite/global/utils';
import { Bound } from '@blocksuite/global/utils';
import { PointLocation } from '@blocksuite/global/utils';
import { DisposableGroup } from '@blocksuite/global/utils';

import type { BlockNode } from '../../root-block/edgeless/edgeless-block-node.js';
import type { SurfaceBlockModel } from '../surface-model.js';
import type { OmitFunctionsAndKeysAndReadOnly } from './utility-type.js';

import { randomSeed } from '../rough/math.js';
import {
  getBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
} from '../utils/math-utils.js';
import {
  convertProps,
  getDeriveProperties,
  getYFieldPropsSet,
  local,
  updateDerivedProp,
  watch,
  yfield,
} from './decorators.js';

export type { NodeHitTestOptions } from '@blocksuite/block-std/edgeless';

export type ModelToProps<
  T extends SurfaceNode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  K extends keyof any,
> = OmitFunctionsAndKeysAndReadOnly<
  T,
  K | 'yMap' | 'surface' | 'display' | 'opacity' | 'externalXYWH'
>;

export type NodeBaseProps = {
  index: string;
  seed: number;
};

export type SerializedNode = Record<string, unknown> & {
  type: string;
  xywh: SerializedXYWH;
  id: string;
  index: string;
  props: Record<string, unknown>;
};

export abstract class SurfaceNode<Props extends NodeBaseProps = NodeBaseProps>
  implements Node
{
  protected _disposable = new DisposableGroup();

  protected _id: string;

  private _lastXYWH: SerializedXYWH = '[0,0,0,0]';

  protected _local = new Map<string | symbol, unknown>();

  protected _onChange: (payload: {
    props: Record<string, unknown>;
    oldValues: Record<string, unknown>;
    local: boolean;
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

  hitTest(
    x: number,
    y: number,
    _: NodeHitTestOptions,
    __: EditorHost
  ): boolean {
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
    return this.yMap.toJSON() as SerializedNode;
  }

  stash(prop: keyof Props | string) {
    if (this._stashed.has(prop)) {
      return;
    }

    if (!getYFieldPropsSet(this).has(prop as string)) {
      return;
    }

    const curVal = this[prop as unknown as keyof SurfaceNode];

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
          this as unknown as SurfaceNode
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

        updateDerivedProp(derivedProps, this as unknown as SurfaceNode);
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

  get group(): GroupLikeNode | null {
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

export abstract class GroupLikeNode<
  Props extends NodeBaseProps = NodeBaseProps,
> extends SurfaceNode<Props> {
  private _childIds: string[] = [];

  /**
   * Get all descendants of this group
   * @param withoutGroup if true, will not include group element
   */
  descendants(withoutGroup = true) {
    return this.childElements.reduce((prev, child) => {
      if (child instanceof GroupLikeNode) {
        prev = prev.concat(child.descendants());

        !withoutGroup && prev.push(child);
      } else {
        prev.push(child);
      }

      return prev;
    }, [] as BlockSuite.EdgelessModelType[]);
  }

  hasChild(element: string | BlockSuite.EdgelessModelType) {
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
  hasDescendant(element: string | BlockSuite.EdgelessModelType) {
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
    const elements: BlockSuite.EdgelessModelType[] = [];

    for (const key of this.childIds) {
      const element =
        this.surface.getElementById(key) ||
        (this.surface.doc.getBlockById(key) as BlockNode);

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

  @local<SerializedXYWH, GroupLikeNode>()
  accessor xywh: SerializedXYWH = '[0,0,0,0]';
}

export abstract class LocalNode {
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
    interface SurfaceNodeModelMap {}
    type SurfaceNodeModelKeyType = keyof SurfaceNodeModelMap;
    type SurfaceNodeModelType =
      | SurfaceNodeModelMap[SurfaceNodeModelKeyType]
      | SurfaceNode;

    interface SurfaceGroupLikeModelMap {}
    type SurfaceGroupLikeModelKeyType = keyof SurfaceGroupLikeModelMap;
    type SurfaceGroupLikeModelType =
      | SurfaceGroupLikeModelMap[SurfaceGroupLikeModelKeyType]
      | GroupLikeNode;

    interface SurfaceLocalModelMap {}
    type SurfaceLocalModelKeyType = keyof SurfaceLocalModelMap;
    type SurfaceLocalModelType =
      | SurfaceLocalModelMap[SurfaceLocalModelKeyType]
      | LocalNode;

    // not include local model
    type SurfaceNodeType = SurfaceNodeModelType | SurfaceGroupLikeModelType;
    type SurfaceNodeKeyType =
      | SurfaceNodeModelKeyType
      | SurfaceGroupLikeModelKeyType;
  }
}
