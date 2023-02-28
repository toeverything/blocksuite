import { isPointIn } from '../../utils/hit-utils.js';
import { deserializeXYWH, serializeXYWH } from '../../utils/xywh.js';
import { BaseElement, HitTestOptions } from '../base-element.js';

export class DebugElement extends BaseElement {
  x = 0;
  y = 0;
  w = 0;
  h = 0;

  type = 'debug' as const;
  color = '#000000';

  setBound(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  hitTest(x: number, y: number, options?: HitTestOptions) {
    return isPointIn(this, x, y);
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      xywh: serializeXYWH(this.x, this.y, this.w, this.h),
      color: this.color,
    };
  }

  static deserialize(data: Record<string, unknown>): DebugElement {
    const element = new DebugElement(data.id as string);
    element.index = data.index as string;

    const [x, y, w, h] = deserializeXYWH(data.xywh as string);
    element.setBound(x, y, w, h);
    element.color = data.color as string;
    return element;
  }
}
