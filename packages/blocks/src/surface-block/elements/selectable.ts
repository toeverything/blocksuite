import type { BaseBlockModel } from '@blocksuite/store';

import { BLOCK_BATCH } from '../batch.js';
import type { SerializedXYWH } from '../index.js';
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

export const BlockEdgelessMixin = <
  T extends new (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => BaseBlockModel<{ xywh: SerializedXYWH; index: string; rotate: number }>,
>(
  Base: T
) =>
  class SelectableElement extends Base implements IEdgelessElement {
    connectable = true;
    batch = BLOCK_BATCH;

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
  };
