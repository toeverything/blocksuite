import type { IBound } from '../../../consts.js';
import { Utils } from '../../../utils/tl-utils.js';
import type { HitTestOptions } from '../../base-element.js';
import type { ShapeRenderConfig } from '../types.js';

function getTrianglePath(width: number, height: number): Path2D {
  const path2d = new Path2D();
  path2d.moveTo(width / 2, 0);
  path2d.lineTo(width, height);
  path2d.lineTo(0, height);
  path2d.closePath();
  return path2d;
}

export class Triangle {
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

    const path2d = getTrianglePath(renderWidth, renderHeight);

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
    const points = [
      [bound.x + bound.w / 2, bound.y + 0],
      [bound.x + bound.w, bound.y + bound.h],
      [bound.x + 0, bound.y + bound.h],
    ];
    return Utils.pointInPolygon(point, points);
  }
}
