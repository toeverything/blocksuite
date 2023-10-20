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
import type { IEdgelessElement } from './edgeless-element.js';

export const EdgelessSelectableMixin = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends new (...args: any[]) => IEdgelessElement,
>(
  originalClass: T
) =>
  class extends originalClass {
    override get gridBound() {
      const bound = Bound.deserialize(this.xywh);
      return Bound.from(
        getBoundsWithRotation({ ...bound, rotate: this.rotate })
      );
    }

    override containedByBounds(bounds: Bound): boolean {
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

    override getNearestPoint(point: IVec): IVec {
      const bound = Bound.deserialize(this.xywh);
      return polygonNearestPoint(
        rotatePoints(bound.points, bound.center, this.rotate ?? 0),
        point
      );
    }

    override intersectWithLine(start: IVec, end: IVec): PointLocation[] | null {
      const bound = Bound.deserialize(this.xywh);
      return linePolygonIntersects(
        start,
        end,
        rotatePoints(bound.points, bound.center, this.rotate ?? 0)
      );
    }

    override getRelativePointLocation(relativePoint: IVec): PointLocation {
      const bound = Bound.deserialize(this.xywh);
      const point = bound.getRelativePoint(relativePoint);
      const rotatePoint = rotatePoints(
        [point],
        bound.center,
        this.rotate ?? 0
      )[0];
      const points = rotatePoints(bound.points, bound.center, this.rotate ?? 0);
      const tangent = polygonGetPointTangent(points, rotatePoint);
      console.log(rotatePoint, tangent);
      return new PointLocation(rotatePoint, tangent);
    }

    override boxSelect(bound: Bound): boolean {
      return (
        this.containedByBounds(bound) ||
        bound.points.some((point, i, points) =>
          this.intersectWithLine(point, points[(i + 1) % points.length])
        )
      );
    }
  };
