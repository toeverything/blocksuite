import type { RoughCanvas } from 'roughjs/bin/canvas.js';

import { type IBound, StrokeStyle } from '../../../consts.js';
import { isPointIn } from '../../../utils/hit-utils.js';
import type { HitTestOptions } from '../../surface-element.js';
import type { ShapeElement } from '../shape-element.js';
import type { ShapeMethods } from '../types.js';

export const RectMethods: ShapeMethods = {
  render(
    ctx: CanvasRenderingContext2D,
    rc: RoughCanvas,
    element: ShapeElement
  ) {
    const {
      w,
      h,
      strokeWidth,
      filled,
      realFillColor,
      realStrokeColor,
      strokeStyle,
    } = element;

    const renderOffset = Math.max(strokeWidth, 0) / 2;
    const renderWidth = w - renderOffset * 2;
    const renderHeight = h - renderOffset * 2;

    ctx.translate(renderOffset, renderOffset);

    rc.rectangle(0, 0, renderWidth, renderHeight, {
      roughness: 2,
      strokeLineDash: strokeStyle === StrokeStyle.Dashed ? [12, 12] : undefined,
      stroke: realStrokeColor,
      strokeWidth,
      fill: filled ? realFillColor : undefined,
    });
  },

  hitTest(x: number, y: number, bound: IBound, options?: HitTestOptions) {
    return isPointIn(bound, x, y);
  },
};
