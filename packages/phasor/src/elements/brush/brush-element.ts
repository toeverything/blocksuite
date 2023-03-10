import { getStrokePoints } from 'perfect-freehand';

import type { IBound } from '../../consts.js';
import { isPointIn } from '../../utils/hit-utils.js';
import { Utils } from '../../utils/tl-utils.js';
import { deserializeXYWH, serializeXYWH, setXYWH } from '../../utils/xywh.js';
import { BaseElement, HitTestOptions } from '../base-element.js';

function getSolidStrokePoints(points: number[][], lineWidth: number) {
  return getStrokePoints(points, {
    size: lineWidth,
    thinning: 0.65,
    streamline: 0.65,
    smoothing: 0.65,
    easing: t => Math.sin((t * Math.PI) / 2),
    simulatePressure: true,
  });
}

export function getBrushBoundFromPoints(
  points: number[][],
  lineWidth: number
): IBound {
  const { minX, minY, width, height } = Utils.getBoundsFromPoints(points);
  return {
    x: minX - lineWidth / 2,
    y: minY - lineWidth / 2,
    w: width < lineWidth ? lineWidth : width + lineWidth,
    h: height < lineWidth ? lineWidth : height + lineWidth,
  };
}

export class BrushElement extends BaseElement {
  type = 'brush' as const;
  color = '#000000';
  x = 0;
  y = 0;
  w = 0;
  h = 0;

  /* Brush mouse coords relative to left-top corner */
  points: number[][] = [];
  lineWidth = 4;

  hitTest(x: number, y: number, options?: HitTestOptions) {
    return isPointIn(this, x, y);
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      xywh: this._xywh,

      color: this.color,
      lineWidth: this.lineWidth,
      points: JSON.stringify(this.points),
    };
  }

  static deserialize(data: Record<string, unknown>): BrushElement {
    const element = new BrushElement(data.id as string);
    element.index = data.index as string;
    element.color = data.color as string;
    element.lineWidth = data.lineWidth as number;

    const [x, y, w, h] = deserializeXYWH(data.xywh as string);
    setXYWH(element, { x, y, w, h });
    element.points = JSON.parse(data.points as string);
    return element;
  }

  static getBoundProps(
    element: BaseElement,
    bound: IBound
  ): Record<string, string> {
    const elementH = element.h || 1;
    const elementW = element.w || 1;
    const boundH = bound.h || 1;
    const boundW = bound.w || 1;
    const points = (element as BrushElement).points.map(([x, y]) => {
      return [boundW * (x / elementW), boundH * (y / elementH)];
    });

    return {
      xywh: serializeXYWH(bound.x, bound.y, bound.w, bound.h),
      points: JSON.stringify(points),
    };
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.translate(this.lineWidth / 2, this.lineWidth / 2);

    // render stroke points
    const stroke = getSolidStrokePoints(this.points, this.lineWidth);
    const commands = Utils.getSvgPathFromStrokePoints(stroke);
    const path = new Path2D(commands);

    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(path);
  }
}
