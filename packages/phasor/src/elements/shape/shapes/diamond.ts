import type { RoughCanvas } from 'roughjs/bin/canvas.js';

import { type IBound, StrokeStyle } from '../../../consts.js';
import { Utils } from '../../../utils/math-utils.js';
import type { HitTestOptions } from '../../surface-element.js';
import type { ShapeElement } from '../shape-element.js';
import type { ShapeMethods } from '../types.js';

export const DiamondMethods: ShapeMethods = {
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
      strokeStyle,
      roughness,
    } = element;

    const renderOffset = Math.max(strokeWidth, 0) / 2;
    const renderWidth = w - renderOffset * 2;
    const renderHeight = h - renderOffset * 2;

    ctx.translate(renderOffset, renderOffset);

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

  hitTest(x: number, y: number, bound: IBound, options?: HitTestOptions) {
    const points = [
      [bound.x + bound.w / 2, bound.y + 0],
      [bound.x + bound.w, bound.y + bound.h / 2],
      [bound.x + bound.w / 2, bound.y + bound.h],
      [bound.x + 0, bound.y + bound.h / 2],
    ];
    return Utils.pointInPolygon([x, y], points);
  },
};
