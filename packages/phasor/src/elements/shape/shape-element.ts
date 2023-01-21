import { BaseElement } from '../base-element.js';

export type ShapeType = 'rect' | 'triangle';

export class ShapeElement extends BaseElement {
  type = 'shape' as const;
  path: Path2D;
  shapeType: ShapeType;
  color = '#000000';
  constructor(id: string, shapeType: ShapeType) {
    super(id);
    this.shapeType = shapeType;

    const path = new Path2D();
    this.path = path;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      shapeType: this.shapeType,
      xywh: `${this.x},${this.y},${this.w},${this.h}`,
      color: this.color,
    };
  }

  static deserialize(data: Record<string, unknown>): ShapeElement {
    const shapeType = data.shapeType as ShapeType;
    const element = new ShapeElement(data.id as string, shapeType);
    element.index = data.index as string;

    const [x, y, w, h] = (data.xywh as string).split(',').map(v => Number(v));
    element.setBound(x, y, w, h);
    element.color = data.color as string;
    return element;
  }
}
