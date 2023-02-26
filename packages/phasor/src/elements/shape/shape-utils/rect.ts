import type { IBound } from '../../../consts.js';
import { isPointIn } from '../../../utils/hit-utils.js';
import type { HitTestOptions } from '../../base-element.js';
import type { ShapeRenderConfig } from '../types.js';

/* "magic number" for bezier approximations of arcs (http://itc.ktu.lt/itc354/Riskus354.pdf) */
const kRect = 1 - 0.5522847498;
const roundedRate = 0.1;

function createRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  ry: number
): Path2D {
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

    const path2d = createRectPath(0, 0, renderWidth, renderHeight, rx, ry);

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
