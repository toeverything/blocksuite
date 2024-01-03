import {
  DEFAULT_CENTRAL_AREA_RATIO,
  type IBound,
  ShapeStyle,
  StrokeStyle,
} from '../../../consts.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import { Bound } from '../../../utils/bound.js';
import {
  getPointsFromBoundsWithRotation,
  lineEllipseIntersects,
  pointInEllipse,
} from '../../../utils/math-utils.js';
import { PointLocation } from '../../../utils/point-location.js';
import { type IVec, Vec } from '../../../utils/vec.js';
import type { HitTestOptions } from '../../edgeless-element.js';
import { ShapeType } from '../consts.js';
import type { ShapeElement } from '../shape-element.js';
import type { ShapeMethods } from '../types.js';
import { drawGeneralShape, hitTestOnShapeText } from '../utils.js';

export const EllipseMethods: ShapeMethods = {
  points({ x, y, w, h }: IBound) {
    return [
      [x, y + h / 2],
      [x + w / 2, y],
      [x + w, y + h / 2],
      [x + w / 2, y + h],
    ];
  },
  render(
    ctx: CanvasRenderingContext2D,
    matrix: DOMMatrix,
    rc: RoughCanvas,
    element: ShapeElement
  ) {
    const {
      seed,
      strokeWidth,
      filled,
      realFillColor,
      realStrokeColor,
      strokeStyle,
      roughness,
      rotate,
      shapeStyle,
    } = element;
    const [, , w, h] = element.deserializeXYWH();
    const renderOffset = Math.max(strokeWidth, 0) / 2;
    const renderWidth = Math.max(1, w - renderOffset * 2);
    const renderHeight = Math.max(1, h - renderOffset * 2);
    const cx = renderWidth / 2;
    const cy = renderHeight / 2;

    ctx.setTransform(
      matrix
        .translateSelf(renderOffset, renderOffset)
        .translateSelf(cx, cy)
        .rotateSelf(rotate)
        .translateSelf(-cx, -cy)
    );

    if (shapeStyle === ShapeStyle.General) {
      drawGeneralShape(ctx, ShapeType.Ellipse, {
        x: 0,
        y: 0,
        width: renderWidth,
        height: renderHeight,
        strokeWidth,
        strokeColor: realStrokeColor,
        strokeStyle: strokeStyle,
        fillColor: realFillColor,
      });
    } else {
      rc.ellipse(cx, cy, renderWidth, renderHeight, {
        seed,
        roughness: shapeStyle === ShapeStyle.Scribbled ? roughness : 0,
        strokeLineDash:
          strokeStyle === StrokeStyle.Dashed ? [12, 12] : undefined,
        stroke: strokeStyle === StrokeStyle.None ? 'none' : realStrokeColor,
        strokeWidth,
        fill: filled ? realFillColor : undefined,
        curveFitting: 1,
      });
    }
  },

  hitTest(this: ShapeElement, x: number, y: number, options: HitTestOptions) {
    const point = [x, y];
    const expand = (options?.expand ?? 1) / (this.renderer?.zoom ?? 1);
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
          hit = hitTestOnShapeText([x, y], this);
        }
      }
    }

    return hit;
  },

  containedByBounds(bounds: Bound, element: ShapeElement): boolean {
    const points = getPointsFromBoundsWithRotation(
      element,
      EllipseMethods.points
    );
    return points.some(point => bounds.containsPoint(point));
  },

  getNearestPoint(point: IVec, _element: ShapeElement) {
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

  intersectWithLine(start: IVec, end: IVec, element: ShapeElement) {
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

  getRelativePointLocation(position, element) {
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
