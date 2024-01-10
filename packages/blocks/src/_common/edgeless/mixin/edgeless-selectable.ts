import type { Constructor } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

import type { SurfaceBlockModel } from '../../../models.js';
import { type IEdgelessElement } from '../../../page-block/edgeless/type.js';
import {
  Bound,
  getBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  type IVec,
  linePolygonIntersects,
  PointLocation,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
  type SerializedXYWH,
} from '../../../surface-block/index.js';

export type EdgelessSelectableProps = {
  xywh: SerializedXYWH;
  index: string;
  rotate?: number;
};

export function selectable<
  Props extends EdgelessSelectableProps,
  T extends Constructor<BlockModel<Props>> = Constructor<BlockModel<Props>>,
>(SuperClass: T) {
  class DerivedSelectableInEdgelessClass
    extends SuperClass
    implements IEdgelessElement
  {
    connectable = true;
    override rotate = 0;

    get edgeless() {
      return true;
    }

    get elementBound() {
      const bound = Bound.deserialize(this.xywh);
      return Bound.from(
        getBoundsWithRotation({ ...bound, rotate: this.rotate })
      );
    }

    hitTest(x: number, y: number): boolean {
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

    get group() {
      const surfaceModel = this.page.getBlockByFlavour(
        'affine:surface'
      ) as SurfaceBlockModel[];

      return surfaceModel[0]?.getGroup(this.id) ?? null;
    }

    get groups() {
      const surfaceModel = this.page.getBlockByFlavour(
        'affine:surface'
      ) as SurfaceBlockModel[];

      return surfaceModel[0]?.getGroups(this.id) ?? [];
    }
  }

  return DerivedSelectableInEdgelessClass as Constructor<
    BlockModel<Props> & IEdgelessElement
  >;
}
