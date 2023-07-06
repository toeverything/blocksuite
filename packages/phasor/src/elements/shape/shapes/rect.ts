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
import type { IVec } from '../../../utils/vec.js';
import type { HitTestOptions } from '../../surface-element.js';
import type { ShapeElement } from '../shape-element.js';
import type { ShapeMethods } from '../types.js';

/* "magic number" for bezier approximations of arcs (http://itc.ktu.lt/itc354/Riskus354.pdf) */
const kRect = 1 - 0.5522847498;

export const RectMethods: ShapeMethods = {
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
      radius,
      strokeStyle,
      roughness,
      rotate,
    } = element;
    const [, , w, h] = element.deserializeXYWH();
    const renderOffset = Math.max(strokeWidth, 0) / 2;
    const renderWidth = w - renderOffset * 2;
    const renderHeight = h - renderOffset * 2;
    const r = Math.min(renderWidth * radius, renderHeight * radius);
    const cx = renderWidth / 2;
    const cy = renderHeight / 2;

    ctx.setTransform(
      matrix
        .translateSelf(renderOffset, renderOffset)
        .translateSelf(cx, cy)
        .rotateSelf(rotate)
        .translateSelf(-cx, -cy)
    );

    rc.path(
      `
      M${r} 0
      L${renderWidth - r} 0
      C ${renderWidth - kRect * r} 0 ${renderWidth} ${
        kRect * r
      } ${renderWidth} ${r}
      L${renderWidth} ${renderHeight - r}
      C ${renderWidth} ${renderHeight - kRect * r} ${
        renderWidth - kRect * r
      } ${renderHeight} ${renderWidth - r} ${renderHeight}
      L${r} ${renderHeight}
      C ${kRect * r} ${renderHeight} 0 ${renderHeight - kRect * r} 0 ${
        renderHeight - r
      }
      L0 ${r}
      C 0 ${kRect * r} ${kRect * r} 0 ${r} 0
      Z
      `,
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
    const points = getPointsFromBoundsWithRotation(this);

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

  containedByBounds(bounds: Bound, element: ShapeElement): boolean {
    const points = getPointsFromBoundsWithRotation(element);
    return points.some(point => bounds.containsPoint(point));
  },

  getNearestPoint(point: IVec, element: ShapeElement) {
    const points = getPointsFromBoundsWithRotation(element);
    return polygonNearestPoint(points, point);
  },

  intersectWithLine(start: IVec, end: IVec, element: ShapeElement) {
    const points = getPointsFromBoundsWithRotation(element);
    return linePolygonIntersects(start, end, points);
  },
};
