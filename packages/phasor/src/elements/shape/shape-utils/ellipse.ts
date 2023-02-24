import type { IBound } from '../../../consts.js';
import { Utils } from '../../../utils/tl-utils.js';
import type { HitTestOptions } from '../../base-element.js';
import type { ShapeRenderConfig } from '../types.js';

function getEllipsePath(width: number, height: number): Path2D {
  const path2d = new Path2D();
  path2d.ellipse(
    width / 2,
    height / 2,
    width / 2,
    height / 2,
    0,
    0,
    2 * Math.PI
  );
  return path2d;
}

export class Ellipse {
  static render(
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

    const path2d = getEllipsePath(renderWidth, renderHeight);

    if (filled) {
      ctx.fillStyle = fillColor;
      ctx.fill(path2d);
    }

    if (strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke(path2d);
    }
  }

  static hitTest(
    point: [number, number],
    bound: IBound,
    options?: HitTestOptions
  ) {
    return Utils.pointInEllipse(
      point,
      [bound.x + bound.w / 2, bound.y + bound.h / 2],
      bound.w / 2,
      bound.h / 2
    );
  }
}
