import { StrokeStyle } from '../../../consts.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import { Bound } from '../../../utils/bound.js';
import {
  isPointIn,
  linePolygonIntersects,
  pointOnPolygonStoke,
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
      flipX,
      flipY,
      widthAndHeight: [w, h],
    } = element;

    const renderOffset = Math.max(strokeWidth, 0) / 2;
    const renderWidth = w - renderOffset * 2;
    const renderHeight = h - renderOffset * 2;
    const r = Math.min(renderWidth * radius, renderHeight * radius);
    const cx = w / 2;
    const cy = h / 2;

    matrix.translateSelf(cx, cy);

    if (flipX < 0) {
      matrix = matrix.flipX();
    }
    if (flipY < 0) {
      matrix = matrix.flipY();
    }

    ctx.setTransform(matrix.rotateSelf(rotate).translateSelf(-cx, -cy));

    // ctx.setTransform(
    //   matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
    // );

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

  intersectWithLine(start: IVec, end: IVec, element: ShapeElement): boolean {
    return !!linePolygonIntersects(
      start,
      end,
      Bound.deserialize(element.xywh).points
    );
  },
};
