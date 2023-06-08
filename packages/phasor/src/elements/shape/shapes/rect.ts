import type { RoughCanvas } from 'roughjs/bin/canvas.js';

import { type IBound, StrokeStyle } from '../../../consts.js';
import { isPointIn } from '../../../utils/math-utils.js';
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

  hitTest(x: number, y: number, bound: IBound, options?: HitTestOptions) {
    return isPointIn(bound, x, y);
  },
};
