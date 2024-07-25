import type { IBound } from '@blocksuite/global/utils';
import type { IVec } from '@blocksuite/global/utils';

import { Bound } from '@blocksuite/global/utils';
import { PointLocation } from '@blocksuite/global/utils';

import type { ElementHitTestOptions } from '../../base.js';
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

export const rect = {
  points({ x, y, w, h }: IBound) {
    return [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ];
  },
  draw(ctx: CanvasRenderingContext2D, { x, y, w, h, rotate = 0 }: IBound) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.translate(-x - w / 2, -y - h / 2);
    ctx.rect(x, y, w, h);
    ctx.restore();
  },
  hitTest(
    this: ShapeElementModel,
    x: number,
    y: number,
    options: ElementHitTestOptions
  ) {
    const points = getPointsFromBoundsWithRotation(this);

    let hit = pointOnPolygonStoke(
      [x, y],
      points,
      (options?.expand ?? 1) / (options.zoom ?? 1)
    );

    if (!hit) {
      // If the point is not on the stroke, check if it is in the shape
      // When the shape is filled and transparent is not ignored
      if (!options.ignoreTransparent || this.filled) {
        hit = pointInPolygon([x, y], points);
      } else {
        // If shape is not filled or transparent
        // Check if hit the text area
        const text = this.text;
        if (!text || !text.length) {
          // if not, check the default center area of the shape
          const centralBounds = getCenterAreaBounds(
            this,
            DEFAULT_CENTRAL_AREA_RATIO
          );
          const centralPoints = getPointsFromBoundsWithRotation(centralBounds);
          // Check if the point is in the center area
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

  containedByBounds(bounds: Bound, element: ShapeElementModel): boolean {
    const points = getPointsFromBoundsWithRotation(element);
    return points.some(point => bounds.containsPoint(point));
  },

  getNearestPoint(point: IVec, element: ShapeElementModel) {
    const points = getPointsFromBoundsWithRotation(element);
    return polygonNearestPoint(points, point);
  },

  intersectWithLine(start: IVec, end: IVec, element: ShapeElementModel) {
    const points = getPointsFromBoundsWithRotation(element);
    return linePolygonIntersects(start, end, points);
  },

  getRelativePointLocation(relativePoint: IVec, element: ShapeElementModel) {
    const bound = Bound.deserialize(element.xywh);
    const point = bound.getRelativePoint(relativePoint);
    const rotatePoint = rotatePoints(
      [point],
      bound.center,
      element.rotate ?? 0
    )[0];
    const points = rotatePoints(
      bound.points,
      bound.center,
      element.rotate ?? 0
    );
    const tangent = polygonGetPointTangent(points, rotatePoint);
    return new PointLocation(rotatePoint, tangent);
  },
};
