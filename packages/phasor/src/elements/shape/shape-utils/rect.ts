import type { IBound } from '../../../consts.js';
import { isPointIn } from '../../../utils/hit-utils.js';
import type { HitTestOptions } from '../../base-element.js';
import type { ShapeRenderConfig } from '../types.js';

/* "magic number" for bezier approximations of arcs (http://itc.ktu.lt/itc354/Riskus354.pdf) */
const kRect = 1 - 0.5522847498;
const roundedRate = 0.1;

function getRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  ry: number
): Path2D {
  const path2d = new Path2D();

  path2d.moveTo(x + rx, y);

  path2d.lineTo(x + w - rx, y);
  path2d.bezierCurveTo(
    x + w - kRect * rx,
    y,
    x + w,
    y + kRect * ry,
    x + w,
    y + ry
  );

  path2d.lineTo(x + w, y + h - ry);
  path2d.bezierCurveTo(
    x + w,
    y + h - kRect * ry,
    x + w - kRect * rx,
    y + h,
    x + w - rx,
    y + h
  );

  path2d.lineTo(x + rx, y + h);
  path2d.bezierCurveTo(
    x + kRect * rx,
    y + h,
    x,
    y + h - kRect * ry,
    x,
    y + h - ry
  );

  path2d.lineTo(x, y + ry);
  path2d.bezierCurveTo(x, y + kRect * ry, x + kRect * rx, y, x + rx, y);

  path2d.closePath();
  return path2d;
}

export class Rect {
  static render(
    ctx: CanvasRenderingContext2D,
    {
      width,
      height,
      rounded,
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
    const rx = rounded ? renderWidth * roundedRate : 0;
    const ry = rounded ? renderHeight * roundedRate : 0;

    ctx.translate(renderOffset, renderOffset);

    const path2d = getRectPath(0, 0, renderWidth, renderHeight, rx, ry);

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
    return isPointIn(bound, point[0], point[1]);
  }
}
