import type { IBound } from '../../../consts.js';
import { Utils } from '../../../utils/tl-utils.js';
import type { HitTestOptions } from '../../base-element.js';
import type { ShapeMethods, ShapeRenderConfig } from '../types.js';

function createTrianglePath(width: number, height: number): Path2D {
  const path = new Path2D();
  path.moveTo(width / 2, 0);
  path.lineTo(width, height);
  path.lineTo(0, height);
  path.closePath();
  return path;
}

export const TriangleMethods: ShapeMethods = {
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

    const path = createTrianglePath(renderWidth, renderHeight);

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
    const points = [
      [bound.x + bound.w / 2, bound.y + 0],
      [bound.x + bound.w, bound.y + bound.h],
      [bound.x + 0, bound.y + bound.h],
    ];
    return Utils.pointInPolygon([x, y], points);
  },
};
