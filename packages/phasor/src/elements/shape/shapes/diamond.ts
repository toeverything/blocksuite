import { StrokeStyle } from '../../../consts.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import { type Bound } from '../../../utils/bound.js';
import {
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  pointInPolygon,
  pointOnPolygonStoke,
  polygonNearestPoint,
} from '../../../utils/math-utils.js';
import { type IVec } from '../../../utils/vec.js';
import type { HitTestOptions } from '../../surface-element.js';
import type { ShapeElement } from '../shape-element.js';
import type { ShapeMethods } from '../types.js';

export const DiamondMethods: ShapeMethods = {
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

    rc.polygon(
      [
        [renderWidth / 2, 0],
        [renderWidth, renderHeight / 2],
        [renderWidth / 2, renderHeight],
        [0, renderHeight / 2],
      ],
      {
        seed,
        roughness,
        strokeLineDash:
          strokeStyle === StrokeStyle.Dashed ? [12, 12] : undefined,
        stroke: realStrokeColor,
        strokeWidth,
        fill: filled ? realFillColor : undefined,
      }
    );
  },

  hitTest(this: ShapeElement, x: number, y: number, options?: HitTestOptions) {
    const points = getPointsFromBoundsWithRotation(this, ({ x, y, w, h }) => [
      [x, y + h / 2],
      [x + w / 2, y],
      [x + w, y + h / 2],
      [x + w / 2, y + h],
    ]);

    let hited = pointOnPolygonStoke(
      [x, y],
      points,
      (options?.expand ?? 1) / (this.renderer?.zoom ?? 1)
    );

    if (this.filled && !hited) {
      hited = pointInPolygon([x, y], points);
    }

    return hited;
  },

  containedByBounds(bounds: Bound, element: ShapeElement) {
    const points = getPointsFromBoundsWithRotation(
      element,
      ({ x, y, w, h }) => [
        [x, y + h / 2],
        [x + w / 2, y],
        [x + w, y + h / 2],
        [x + w / 2, y + h],
      ]
    );
    return points.some(point => bounds.containsPoint(point));
  },

  getNearestPoint(point: IVec, element: ShapeElement) {
    const points = getPointsFromBoundsWithRotation(
      element,
      ({ x, y, w, h }) => [
        [x, y + h / 2],
        [x + w / 2, y],
        [x + w, y + h / 2],
        [x + w / 2, y + h],
      ]
    );
    return polygonNearestPoint(points, point);
  },

  intersectWithLine(start: IVec, end: IVec, element: ShapeElement) {
    const points = getPointsFromBoundsWithRotation(
      element,
      ({ x, y, w, h }) => [
        [x, y + h / 2],
        [x + w / 2, y],
        [x + w, y + h / 2],
        [x + w / 2, y + h],
      ]
    );
    return linePolygonIntersects(start, end, points);
  },
};
