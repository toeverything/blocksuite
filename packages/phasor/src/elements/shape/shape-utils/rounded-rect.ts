import type { IBound } from '../../../consts.js';
import { isPointIn } from '../../../utils/hit-utils.js';
import type { HitTestOptions } from '../../base-element.js';
import type { RenderSequenceItem, ShapeRenderConfig } from '../types.js';

/* "magic number" for bezier approximations of arcs (http://itc.ktu.lt/itc354/Riskus354.pdf) */
const kRect = 1 - 0.5522847498;
const radioRate = 0.1;

function paintRoundedRect(x: number, y: number, w: number, h: number): Path2D {
  const rx = radioRate * w;
  const ry = radioRate * h;
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

export class RoundedRect {
  static createRenderSequence({
    width,
    height,
    fillColor,
    strokeWidth,
    strokeColor,
    strokeStyle,
  }: ShapeRenderConfig): RenderSequenceItem[] {
    const sequence: RenderSequenceItem[] = [];

    if (fillColor) {
      const fillPath2d = paintRoundedRect(0, 0, width, height);

      sequence.push({
        type: 'fill',
        path2d: fillPath2d,
        color: fillColor,
      });
    }

    if (strokeWidth > 0) {
      const strokePath2d = paintRoundedRect(
        strokeWidth / 2,
        strokeWidth / 2,
        width - strokeWidth,
        height - strokeWidth
      );
      sequence.push({
        type: 'stroke',
        path2d: strokePath2d,
        width: strokeWidth,
        color: strokeColor,
        style: strokeStyle,
      });
    }

    return sequence;
  }

  static hitTest(
    point: [number, number],
    bound: IBound,
    options?: HitTestOptions
  ) {
    return isPointIn(bound, point[0], point[1]);
  }
}
