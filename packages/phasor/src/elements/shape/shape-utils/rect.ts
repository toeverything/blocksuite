import type { IBound } from '../../../consts.js';
import { isPointIn } from '../../../utils/hit-utils.js';
import type { HitTestOptions } from '../../base-element.js';
import type { RenderSequenceItem, ShapeRenderConfig } from '../types.js';

export class Rect {
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
      fillPath2d.rect(0, 0, width, height);
      sequence.push({
        type: 'fill',
        path2d: fillPath2d,
        color: fillColor,
      });
    }

    if (strokeWidth > 0) {
      const strokePath2d = new Path2D();
      strokePath2d.rect(
        0 + strokeWidth / 2,
        0 + strokeWidth / 2,
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
