import type { IBound } from '../../../consts.js';
import { Utils } from '../../../utils/tl-utils.js';
import type { HitTestOptions } from '../../base-element.js';
import type { RenderSequenceItem, ShapeRenderConfig } from '../types.js';

export class Ellipse {
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
      fillPath2d.ellipse(
        width / 2,
        height / 2,
        width / 2,
        height / 2,
        0,
        0,
        2 * Math.PI
      );
      sequence.push({
        type: 'fill',
        path2d: fillPath2d,
        color: fillColor,
      });
    }

    if (strokeWidth > 0) {
      const strokePath2d = new Path2D();
      strokePath2d.ellipse(
        width / 2,
        height / 2,
        width / 2 - strokeWidth / 2,
        height / 2 - strokeWidth / 2,
        0,
        0,
        2 * Math.PI
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
    return Utils.pointInEllipse(
      point,
      [bound.x + bound.w / 2, bound.y + bound.h / 2],
      bound.w / 2,
      bound.h / 2
    );
  }
}
