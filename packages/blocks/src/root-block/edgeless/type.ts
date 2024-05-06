import type { EditorHost } from '@blocksuite/block-std';
import { BlockModel } from '@blocksuite/store';

import type { EdgelessSelectableProps } from '../../_common/edgeless/mixin/edgeless-selectable.js';
import type {
  BaseProps,
  ElementModel,
  GroupLikeModel,
} from '../../surface-block/element-model/base.js';
import type { SurfaceBlockModel } from '../../surface-block/surface-model.js';
import { Bound } from '../../surface-block/utils/bound.js';
import {
  getBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
} from '../../surface-block/utils/math-utils.js';
import { PointLocation } from '../../surface-block/utils/point-location.js';
import type { IVec } from '../../surface-block/utils/vec.js';
import type { SerializedXYWH } from '../../surface-block/utils/xywh.js';

export interface HitTestOptions {
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
  group: GroupLikeModel<BaseProps> | null;
  groups: GroupLikeModel<BaseProps>[];
  containedByBounds(bounds: Bound): boolean;
  getNearestPoint(point: IVec): IVec;
  intersectWithLine(start: IVec, end: IVec): PointLocation[] | null;
  getRelativePointLocation(point: IVec): PointLocation;
  hitTest(
    x: number,
    y: number,
    options: HitTestOptions,
    host: EditorHost
  ): boolean;
  boxSelect(bound: Bound): boolean;
}

export class EdgelessBlockModel<
    Props extends EdgelessSelectableProps = EdgelessSelectableProps,
  >
  extends BlockModel<Props>
  implements IEdgelessElement
{
  connectable = true;
  rotate = 0;

  private _externalXYWH: SerializedXYWH | undefined = undefined;

  get externalXYWH(): SerializedXYWH | undefined {
    return this._externalXYWH;
  }

  set externalXYWH(xywh: SerializedXYWH | undefined) {
    this._externalXYWH = xywh;
  }

  get externalBound(): Bound | null {
    return this._externalXYWH ? Bound.deserialize(this._externalXYWH) : null;
  }

  get elementBound() {
    const bound = Bound.deserialize(this.xywh);
    return Bound.from(getBoundsWithRotation({ ...bound, rotate: this.rotate }));
  }

  hitTest(x: number, y: number, _: HitTestOptions, __: EditorHost): boolean {
    const bound = Bound.deserialize(this.xywh);
    return bound.isPointInBound([x, y], 0);
  }

  containedByBounds(bounds: Bound): boolean {
    const bound = Bound.deserialize(this.xywh);
    const points = getPointsFromBoundsWithRotation({
      x: bound.x,
      y: bound.y,
      w: bound.w,
      h: bound.h,
      rotate: this.rotate,
    });
    return points.some(point => bounds.containsPoint(point));
  }

  getNearestPoint(point: IVec): IVec {
    const bound = Bound.deserialize(this.xywh);
    return polygonNearestPoint(
      rotatePoints(bound.points, bound.center, this.rotate ?? 0),
      point
    );
  }

  intersectWithLine(start: IVec, end: IVec): PointLocation[] | null {
    const bound = Bound.deserialize(this.xywh);
    return linePolygonIntersects(
      start,
      end,
      rotatePoints(bound.points, bound.center, this.rotate ?? 0)
    );
  }

  getRelativePointLocation(relativePoint: IVec): PointLocation {
    const bound = Bound.deserialize(this.xywh);
    const point = bound.getRelativePoint(relativePoint);
    const rotatePoint = rotatePoints(
      [point],
      bound.center,
      this.rotate ?? 0
    )[0];
    const points = rotatePoints(bound.points, bound.center, this.rotate ?? 0);
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

  get group(): IEdgelessElement['group'] {
    const surfaceModel = this.doc.getBlockByFlavour(
      'affine:surface'
    ) as SurfaceBlockModel[];

    return surfaceModel[0]?.getGroup(this.id) ?? null;
  }

  get groups() {
    const surfaceModel = this.doc.getBlockByFlavour(
      'affine:surface'
    ) as SurfaceBlockModel[];

    return surfaceModel[0]?.getGroups(this.id) ?? [];
  }
}

export type EdgelessModel = EdgelessBlockModel | ElementModel | GroupLikeModel;
