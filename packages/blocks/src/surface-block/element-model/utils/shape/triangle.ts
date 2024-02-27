import type { HitTestOptions } from '../../../../root-block/edgeless/type.js';
import { DEFAULT_CENTRAL_AREA_RATIO, type IBound } from '../../../consts.js';
import { Bound } from '../../../utils/bound.js';
import {
  getCenterAreaBounds,
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  pointInPolygon,
  pointOnPolygonStoke,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
} from '../../../utils/math-utils.js';
import { PointLocation } from '../../../utils/point-location.js';
import type { IVec2 } from '../../../utils/vec.js';
import type { ShapeElementModel } from '../../shape.js';

export const triangle = {
  points({ x, y, w, h }: IBound) {
    return [
      [x, y + h],
      [x + w / 2, y],
      [x + w, y + h],
    ];
  },
  hitTest(
    this: ShapeElementModel,
    x: number,
    y: number,
    options: HitTestOptions
  ) {
    const points = getPointsFromBoundsWithRotation(this, triangle.points);

    let hit = pointOnPolygonStoke(
      [x, y],
      points,
      (options?.expand ?? 1) / (options?.zoom ?? 1)
    );

    if (!hit) {
      if (!options.ignoreTransparent || this.filled) {
        hit = pointInPolygon([x, y], points);
      } else {
        // If shape is not filled or transparent
        const text = this.text;
        if (!text || !text.length) {
          // Check the center area of the shape
          const centralBounds = getCenterAreaBounds(
            this,
            DEFAULT_CENTRAL_AREA_RATIO
          );
          const centralPoints = getPointsFromBoundsWithRotation(
            centralBounds,
            triangle.points
          );
          hit = pointInPolygon([x, y], centralPoints);
        } else {
          hit = this.externalBound?.isPointInBound([x, y]) ?? false;
        }
      }
    }

    return hit;
  },
  containedByBounds(bounds: Bound, element: ShapeElementModel): boolean {
    const points = getPointsFromBoundsWithRotation(element, triangle.points);
    return points.some(point => bounds.containsPoint(point));
  },

  getNearestPoint(point: IVec2, element: ShapeElementModel) {
    const points = getPointsFromBoundsWithRotation(element, triangle.points);
    return polygonNearestPoint(points, point);
  },

  intersectWithLine(start: IVec2, end: IVec2, element: ShapeElementModel) {
    const points = getPointsFromBoundsWithRotation(element, triangle.points);
    return linePolygonIntersects(start, end, points);
  },

  getRelativePointLocation(position: IVec2, element: ShapeElementModel) {
    const bound = Bound.deserialize(element.xywh);
    const point = bound.getRelativePoint(position);
    let points = triangle.points(bound);
    points.push(point);

    points = rotatePoints(points, bound.center, element.rotate);
    const rotatePoint = points.pop() as IVec2;
    const tangent = polygonGetPointTangent(points, rotatePoint);
    return new PointLocation(rotatePoint, tangent);
  },
};
