import { BaseElement } from '../base-element.js';

export class DebugElement extends BaseElement {
  type = 'debug' as const;
  color = '#000000';

  render(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = this.color;
    ctx.strokeRect(0, 0, this.w, this.h);
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      xywh: `${this.x},${this.y},${this.w},${this.h}`,
      color: this.color,
    };
  }

  static deserialize(data: Record<string, unknown>): DebugElement {
    const element = new DebugElement(data.id as string);
    element.index = data.index as string;

    const [x, y, w, h] = (data.xywh as string).split(',').map(v => Number(v));
    element.setBound(x, y, w, h);
    element.color = data.color as string;
    return element;
  }
}
