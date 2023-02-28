import { getStrokePoints } from 'perfect-freehand';

import type { IBound } from '../../consts.js';
import { Utils } from '../../utils/tl-utils.js';
import { Vec } from '../../utils/vec.js';
import { serializeXYWH, XYWH } from '../../utils/xywh.js';
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

function getBrushBoundFromPoints(
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
  point: [number, number] = [0, 0];
  points: number[][] = [];
  lineWidth = 4;

  private get _xywhArray(): XYWH {
    const [x, y] = this.point;
    const bound = getBrushBoundFromPoints(this.points, this.lineWidth);
    return [x + bound.x, y + bound.y, bound.w, bound.h];
  }

  get x() {
    return this._xywhArray[0];
  }

  get y() {
    return this._xywhArray[1];
  }

  get w() {
    return this._xywhArray[2];
  }

  get h() {
    return this._xywhArray[3];
  }

  protected get _xywh() {
    return serializeXYWH(...this._xywhArray);
  }

  hitTest(x: number, y: number, options?: HitTestOptions) {
    const point = Vec.sub([x, y], [this.x, this.y]);

    const points = getSolidStrokePoints(this.points, this.lineWidth).map(
      s => s.point
    );

    return Utils.pointInPolyline(point, points, this.lineWidth);
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.translate(
      this.point[0] - this.x + this.lineWidth / 2,
      this.point[1] - this.y + this.lineWidth / 2
    );

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
      point: this.point.join(','),
      points: JSON.stringify(this.points),
    };
  }

  static deserialize(data: Record<string, unknown>): BrushElement {
    const element = new BrushElement(data.id as string);
    element.index = data.index as string;

    element.color = data.color as string;
    element.point = (data.point as string).split(',').map(s => Number(s)) as [
      number,
      number
    ];
    element.points = JSON.parse(data.points as string);
    return element;
  }
}
