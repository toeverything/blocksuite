import type { RoughCanvas } from 'roughjs/bin/canvas.js';

import { type IBound, StrokeStyle } from '../../../consts.js';
import { isPointIn } from '../../../utils/hit-utils.js';
import type { HitTestOptions } from '../../surface-element.js';
import type { ShapeElement } from '../shape-element.js';
import type { ShapeMethods } from '../types.js';

/* "magic number" for bezier approximations of arcs (http://itc.ktu.lt/itc354/Riskus354.pdf) */
const kRect = 1 - 0.5522847498;

function createRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  ry: number
) {
  const path = new Path2D();

  path.moveTo(x + rx, y);

  path.lineTo(x + w - rx, y);
  path.bezierCurveTo(
    x + w - kRect * rx,
    y,
    x + w,
    y + kRect * ry,
    x + w,
    y + ry
  );

  path.lineTo(x + w, y + h - ry);
  path.bezierCurveTo(
    x + w,
    y + h - kRect * ry,
    x + w - kRect * rx,
    y + h,
    x + w - rx,
    y + h
  );

  path.lineTo(x + rx, y + h);
  path.bezierCurveTo(
    x + kRect * rx,
    y + h,
    x,
    y + h - kRect * ry,
    x,
    y + h - ry
  );

  path.lineTo(x, y + ry);
  path.bezierCurveTo(x, y + kRect * ry, x + kRect * rx, y, x + rx, y);

  path.closePath();
  return path;
}

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
