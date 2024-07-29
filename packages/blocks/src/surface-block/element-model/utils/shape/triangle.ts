import type { IBound } from '@blocksuite/global/utils';
import type { IVec } from '@blocksuite/global/utils';

import { Bound } from '@blocksuite/global/utils';
import { PointLocation } from '@blocksuite/global/utils';

import type { PointTestOptions } from '../../base.js';
import type { ShapeElementModel } from '../../shape.js';

import { DEFAULT_CENTRAL_AREA_RATIO } from '../../../consts.js';
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

export const triangle = {
  points({ x, y, w, h }: IBound): IVec[] {
    return [
      [x, y + h],
      [x + w / 2, y],
      [x + w, y + h],
    ];
  },
  draw(ctx: CanvasRenderingContext2D, { x, y, w, h, rotate = 0 }: IBound) {
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
  includesPoint(
    this: ShapeElementModel,
    x: number,
    y: number,
    options: PointTestOptions
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
  containsBound(bounds: Bound, element: ShapeElementModel): boolean {
    const points = getPointsFromBoundsWithRotation(element, triangle.points);
    return points.some(point => bounds.containsPoint(point));
  },

  getNearestPoint(point: IVec, element: ShapeElementModel) {
    const points = getPointsFromBoundsWithRotation(element, triangle.points);
    return polygonNearestPoint(points, point);
  },

  getLineIntersections(start: IVec, end: IVec, element: ShapeElementModel) {
    const points = getPointsFromBoundsWithRotation(element, triangle.points);
    return linePolygonIntersects(start, end, points);
  },

  getRelativePointLocation(position: IVec, element: ShapeElementModel) {
    const bound = Bound.deserialize(element.xywh);
    const point = bound.getRelativePoint(position);
    let points = triangle.points(bound);
    points.push(point);

    points = rotatePoints(points, bound.center, element.rotate);
    const rotatePoint = points.pop() as IVec;
    const tangent = polygonGetPointTangent(points, rotatePoint);
    return new PointLocation(rotatePoint, tangent);
  },
};
