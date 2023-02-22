import { Utils } from '../../utils/tl-utils.js';
import { Vec } from '../../utils/vec.js';
import { deserializeXYWH, serializeXYWH } from '../../utils/xywh.js';
import { BaseElement, HitTestOptions } from '../base-element.js';

export class BrushElement extends BaseElement {
  type = 'brush' as const;
  color = '#000000';
  points: number[][] = [];
  lineWidth = 4;

  get tiny() {
    return this.w <= this.lineWidth && this.h <= this.lineWidth;
  }

  hitTest(x: number, y: number, options?: HitTestOptions) {
    const point = Vec.sub([x, y], [this.x, this.y]);

    if (this.tiny) {
      return Utils.pointInCircle(point, [0, 0], this.lineWidth / 2);
    }
    return Utils.pointInPolyline(point, this.points, this.lineWidth);
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();

    if (this.tiny) {
      ctx.fillStyle = this.color;
      ctx.ellipse(
        this.lineWidth / 2,
        this.lineWidth / 2,
        this.lineWidth / 2,
        this.lineWidth / 2,
        0,
        0,
        2 * Math.PI
      );
      ctx.fill();
      return;
    }

    ctx.translate(this.lineWidth / 2, this.lineWidth / 2);
    ctx.moveTo(0, 0);
    for (const [x, y] of this.points) {
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
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
