import type { IVec2 } from '../../../utils/vec.js';
import type { IHitTestOptions } from '../../base.js';
import type { ShapeElementModel } from '../../shape.js';

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

export const triangle = {
  containedByBounds(bounds: Bound, element: ShapeElementModel): boolean {
    const points = getPointsFromBoundsWithRotation(element, triangle.points);
    return points.some(point => bounds.containsPoint(point));
  },
  draw(ctx: CanvasRenderingContext2D, { h, rotate = 0, w, x, y }: IBound) {
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();

    ctx.restore();
  },
  getNearestPoint(point: IVec2, element: ShapeElementModel) {
    const points = getPointsFromBoundsWithRotation(element, triangle.points);
    return polygonNearestPoint(points, point);
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

  hitTest(
    this: ShapeElementModel,
    x: number,
    y: number,
    options: IHitTestOptions
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
          hit = this.textBound
            ? pointInPolygon(
                [x, y],
                getPointsFromBoundsWithRotation(this.textBound)
              )
            : false;
        }
      }
    }

    return hit;
  },

  intersectWithLine(start: IVec2, end: IVec2, element: ShapeElementModel) {
    const points = getPointsFromBoundsWithRotation(element, triangle.points);
    return linePolygonIntersects(start, end, points);
  },

  points({ h, w, x, y }: IBound) {
    return [
      [x, y + h],
      [x + w / 2, y],
      [x + w, y + h],
    ];
  },
};
