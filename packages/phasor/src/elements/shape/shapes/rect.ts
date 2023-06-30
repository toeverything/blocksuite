import { StrokeStyle } from '../../../consts.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import { Bound } from '../../../utils/bound.js';
import {
  isPointIn,
  linePolygonIntersects,
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
    rc: RoughCanvas,
    element: ShapeElement
  ) {
    const {
      w,
      h,
      seed,
      strokeWidth,
      filled,
      realFillColor,
      realStrokeColor,
      radius,
      strokeStyle,
      roughness,
    } = element;

    const renderOffset = Math.max(strokeWidth, 0) / 2;
    const renderWidth = w - renderOffset * 2;
    const renderHeight = h - renderOffset * 2;
    const r = Math.min(renderWidth * radius, renderHeight * radius);

    ctx.translate(renderOffset, renderOffset);

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

  hitTest(
    x: number,
    y: number,
    element: ShapeElement,
    options?: HitTestOptions
  ) {
    return element.filled
      ? isPointIn(element, x, y)
      : pointOnPolygonStoke(
          [x, y],
          [
            [element.x, element.y],
            [element.x + element.w, element.y],
            [element.x + element.w, element.y + element.h],
            [element.x, element.y + element.h],
          ],
          options?.expand ?? 1
        );
  },

  intersectWithLine(start: IVec, end: IVec, element: ShapeElement) {
    return linePolygonIntersects(
      start,
      end,
      Bound.deserialize(element.xywh).points
    );
  },

  getNearestPoint(point: IVec, element: ShapeElement) {
    const bound = Bound.deserialize(element.xywh);
    return polygonNearestPoint(bound.points, point);
  },
};
