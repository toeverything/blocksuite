import { type IBound, ShapeStyle, StrokeStyle } from '../../../consts.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import { Bound } from '../../../utils/bound.js';
import {
  getPointsFromBoundsWithRotation,
  lineEllipseIntersects,
  pointInEllipse,
} from '../../../utils/math-utils.js';
import { PointLocation } from '../../../utils/point-location.js';
import { type IVec } from '../../../utils/vec.js';
import type { HitTestOptions } from '../../surface-element.js';
import type { ShapeElement } from '../shape-element.js';
import type { ShapeMethods } from '../types.js';
import { drawGeneralShape } from '../utils.js';

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
      drawGeneralShape(ctx, 'ellipse', {
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

    let hited =
      pointInEllipse(point, center, rx + expand, ry + expand, rad) &&
      !pointInEllipse(point, center, rx - expand, ry - expand, rad);

    if ((!options.ignoreTransparent || this.filled) && !hited) {
      hited = pointInEllipse(point, center, rx, ry, rad);
    }

    return hited;
  },

  containedByBounds(bounds: Bound, element: ShapeElement): boolean {
    const points = getPointsFromBoundsWithRotation(
      element,
      EllipseMethods.points
    );
    return points.some(point => bounds.containsPoint(point));
  },

  getNearestPoint(point: IVec, _element: ShapeElement) {
    // TODO: get real nearest point on ellipse
    return point;
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
    // TODO: calculate the tangent of point on ellipse
    return new PointLocation(point);
  },
};
