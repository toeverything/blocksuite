import type { IBound } from '../../../consts.js';
import { Utils } from '../../../utils/tl-utils.js';
import type { HitTestOptions } from '../../base-element.js';
import type { ShapeMethods, ShapeRenderConfig } from '../types.js';

function createEllipsePath(width: number, height: number): Path2D {
  const path = new Path2D();
  path.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI);
  return path;
}

export const EllipseMethods: ShapeMethods = {
  render(
    ctx: CanvasRenderingContext2D,
    {
      width,
      height,
      filled,
      fillColor,
      strokeWidth,
      strokeColor,
      strokeStyle,
    }: ShapeRenderConfig
  ) {
    const renderOffset = Math.max(strokeWidth, 0) / 2;
    const renderWidth = width - renderOffset * 2;
    const renderHeight = height - renderOffset * 2;

    ctx.translate(renderOffset, renderOffset);

    const path = createEllipsePath(renderWidth, renderHeight);

    if (filled) {
      ctx.fillStyle = fillColor;
      ctx.fill(path);
    }

    if (strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke(path);
    }
  },

  hitTest(x: number, y: number, bound: IBound, options?: HitTestOptions) {
    return Utils.pointInEllipse(
      [x, y],
      [bound.x + bound.w / 2, bound.y + bound.h / 2],
      bound.w / 2,
      bound.h / 2
    );
  },
};
