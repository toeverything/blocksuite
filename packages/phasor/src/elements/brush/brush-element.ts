import { getStrokePoints } from 'perfect-freehand';

import type { IBound } from '../../consts.js';
import { Utils } from '../../utils/tl-utils.js';
import { Vec } from '../../utils/vec.js';
import { deserializeXYWH, serializeXYWH } from '../../utils/xywh.js';
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
    x: minX,
    y: minY,
    w: width < lineWidth ? lineWidth : width + lineWidth,
    h: height < lineWidth ? lineWidth : height + lineWidth,
  };
}

export class BrushElement extends BaseElement {
  type = 'brush' as const;
  color = '#000000';
  points: number[][] = [];
  lineWidth = 4;

  private get _isTiny() {
    return this.w <= this.lineWidth && this.h <= this.lineWidth;
  }

  hitTest(x: number, y: number, options?: HitTestOptions) {
    const point = Vec.sub([x, y], [this.x, this.y]);

    if (this._isTiny) {
      return Utils.pointInCircle(point, [0, 0], this.lineWidth / 2);
    }
    return Utils.pointInPolyline(point, this.points, this.lineWidth);
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

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      xywh: serializeXYWH(this.x, this.y, this.w, this.h),
      color: this.color,
      points: JSON.stringify(this.points),
    };
  }

  static deserialize(data: Record<string, unknown>): BrushElement {
    const element = new BrushElement(data.id as string);
    element.index = data.index as string;

    const [x, y, w, h] = deserializeXYWH(data.xywh as string);
    element.setBound(x, y, w, h);
    element.color = data.color as string;
    element.points = JSON.parse(data.points as string);
    return element;
  }
}
