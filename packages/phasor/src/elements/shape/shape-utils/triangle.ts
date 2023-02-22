import type { IBound } from '../../../consts.js';
import { Utils } from '../../../utils/tl-utils.js';
import type { HitTestOptions } from '../../base-element.js';
import type { RenderSequenceItem, ShapeRenderConfig } from '../types.js';

export class Triangle {
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
      const fillPath2d = new Path2D();
      fillPath2d.moveTo(width / 2, 0);
      fillPath2d.lineTo(width, height);
      fillPath2d.lineTo(0, height);
      fillPath2d.closePath();
      sequence.push({
        type: 'fill',
        path2d: fillPath2d,
        color: fillColor,
      });
    }

    if (strokeWidth > 0) {
      const strokePath2d = new Path2D();
      strokePath2d.moveTo(width / 2, 0 + strokeWidth / 2);
      strokePath2d.lineTo(width - strokeWidth / 2, height - strokeWidth / 2);
      strokePath2d.lineTo(0 + strokeWidth / 2, height - strokeWidth / 2);
      strokePath2d.closePath();
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
    const points = [
      [bound.x + bound.w / 2, bound.y + 0],
      [bound.x + bound.w, bound.y + bound.h],
      [bound.x + 0, bound.y + bound.h],
    ];
    return Utils.pointInPolygon(point, points);
  }
}
