import type { HitTestOptions } from '../../../../root-block/edgeless/type.js';
import type { IBound } from '../../../consts.js';
import { Bound } from '../../../utils/bound.js';
import {
  getPointsFromBoundsWithRotation,
  lineEllipseIntersects,
  pointInEllipse,
  pointInPolygon,
} from '../../../utils/math-utils.js';
import { PointLocation } from '../../../utils/point-location.js';
import type { IVec2 } from '../../../utils/vec.js';
import { Vec } from '../../../utils/vec.js';
import { DEFAULT_CENTRAL_AREA_RATIO } from '../../common.js';
import type { ShapeElementModel } from '../../shape.js';

export const ellipse = {
  points({ x, y, w, h }: IBound) {
    return [
      [x, y + h / 2],
      [x + w / 2, y],
      [x + w, y + h / 2],
      [x + w / 2, y + h],
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
    ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, 2 * Math.PI);

    ctx.restore();
  },
  hitTest(
    this: ShapeElementModel,
    x: number,
    y: number,
    options: HitTestOptions
  ) {
    const point = [x, y];
    const expand = (options?.expand ?? 1) / (options?.zoom ?? 1);
    const rx = this.w / 2;
    const ry = this.h / 2;
    const center = [this.x + rx, this.y + ry];
    const rad = (this.rotate * Math.PI) / 180;

    let hit =
      pointInEllipse(point, center, rx + expand, ry + expand, rad) &&
      !pointInEllipse(point, center, rx - expand, ry - expand, rad);

    if (!hit) {
      if (!options.ignoreTransparent || this.filled) {
        hit = pointInEllipse(point, center, rx, ry, rad);
      } else {
        // If shape is not filled or transparent
        const text = this.text;
        if (!text || !text.length) {
          // Check the center area of the shape
          const centralRx = rx * DEFAULT_CENTRAL_AREA_RATIO;
          const centralRy = ry * DEFAULT_CENTRAL_AREA_RATIO;
          hit = pointInEllipse(point, center, centralRx, centralRy, rad);
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
    const points = getPointsFromBoundsWithRotation(element, ellipse.points);
    return points.some(point => bounds.containsPoint(point));
  },

  getNearestPoint(point: IVec2, _element: ShapeElementModel) {
    const bound = Bound.deserialize(_element.xywh);

    const iterations = 1000;
    const learningRate = 0.01;
    const cx = bound.center[0];
    const cy = bound.center[1];
    const rx = bound.w / 2;
    const ry = bound.h / 2;

    let x = (point[0] - cx) / rx;
    let y = (point[1] - cy) / ry;

    for (let i = 0; i < iterations; i++) {
      const distance = Math.sqrt(x * x + y * y);
      const normalX = x / distance;
      const normalY = y / distance;

      const toPx = point[0] - (point[0] + x * rx);
      const toPy = point[1] - (point[1] + y * ry);
      const dot = toPx * normalX * rx + toPy * normalY * ry;

      x -= learningRate * dot * normalX;
      y -= learningRate * dot * normalY;
      const angle = Math.atan2(y, x);
      x = Math.cos(angle);
      y = Math.sin(angle);
    }

    return [cx + x * rx, cy + y * ry];
  },

  intersectWithLine(start: IVec2, end: IVec2, element: ShapeElementModel) {
    const rad = (element.rotate * Math.PI) / 180;
    const bound = Bound.deserialize(element.xywh);
    return lineEllipseIntersects(
      start,
      end,
      bound.center,
      bound.w / 2,
      bound.h / 2,
      rad
    );
  },

  getRelativePointLocation(position: IVec2, element: ShapeElementModel) {
    const bound = Bound.deserialize(element.xywh);
    const point = bound.getRelativePoint(position);

    const rx = bound.w / 2;
    const ry = bound.h / 2;

    const normalVector = Vec.uni(
      Vec.divV(Vec.sub(point, bound.center), [rx * rx, ry * ry])
    );
    return new PointLocation(point, [-normalVector[1], normalVector[0]]);
  },
};
