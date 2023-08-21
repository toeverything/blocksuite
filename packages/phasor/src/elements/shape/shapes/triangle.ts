import { type IBound, ShapeStyle, StrokeStyle } from '../../../consts.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import { Bound } from '../../../utils/bound.js';
import {
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  pointInPolygon,
  pointOnPolygonStoke,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
} from '../../../utils/math-utils.js';
import { PointLocation } from '../../../utils/point-location.js';
import { type IVec } from '../../../utils/vec.js';
import type { HitTestOptions } from '../../surface-element.js';
import type { ShapeElement } from '../shape-element.js';
import type { ShapeMethods } from '../types.js';
import { drawGeneralShape } from '../utils.js';

export const TriangleMethods: ShapeMethods = {
  points({ x, y, w, h }: IBound) {
    return [
      [x, y + h],
      [x + w / 2, y],
      [x + w, y + h],
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
    const renderWidth = w - renderOffset * 2;
    const renderHeight = h - renderOffset * 2;
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
      drawGeneralShape(ctx, 'triangle', {
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
      rc.polygon(
        [
          [renderWidth / 2, 0],
          [renderWidth, renderHeight],
          [0, renderHeight],
        ],
        {
          seed,
          roughness: shapeStyle === ShapeStyle.Scribbled ? roughness : 0,
          strokeLineDash:
            strokeStyle === StrokeStyle.Dashed ? [12, 12] : undefined,
          stroke: strokeStyle === StrokeStyle.None ? 'none' : realStrokeColor,
          strokeWidth,
          fill: filled ? realFillColor : undefined,
        }
      );
    }
  },

  hitTest(this: ShapeElement, x: number, y: number, options: HitTestOptions) {
    const points = getPointsFromBoundsWithRotation(
      this,
      TriangleMethods.points
    );

    let hited = pointOnPolygonStoke(
      [x, y],
      points,
      (options?.expand ?? 1) / (this.renderer?.zoom ?? 1)
    );

    if ((!options.ignoreTransparent || this.filled) && !hited) {
      hited = pointInPolygon([x, y], points);
    }

    return hited;
  },

  containedByBounds(bounds: Bound, element: ShapeElement): boolean {
    const points = getPointsFromBoundsWithRotation(
      element,
      TriangleMethods.points
    );
    return points.some(point => bounds.containsPoint(point));
  },

  getNearestPoint(point: IVec, element: ShapeElement) {
    const points = getPointsFromBoundsWithRotation(
      element,
      TriangleMethods.points
    );
    return polygonNearestPoint(points, point);
  },

  intersectWithLine(start: IVec, end: IVec, element: ShapeElement) {
    const points = getPointsFromBoundsWithRotation(
      element,
      TriangleMethods.points
    );
    return linePolygonIntersects(start, end, points);
  },

  getRelativePointLocation(position, element) {
    const bound = Bound.deserialize(element.xywh);
    const point = bound.getRelativePoint(position);
    let points = TriangleMethods.points(bound);
    points.push(point);

    points = rotatePoints(points, bound.center, element.rotate);
    const rotatePoint = points.pop() as IVec;
    const tangent = polygonGetPointTangent(points, rotatePoint);
    return new PointLocation(rotatePoint, tangent);
  },
};
