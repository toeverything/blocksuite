import { BaseElement } from '../base-element.js';
import { getRectanglePath } from './rect-utils.js';
import { DashStyle, ShapeStyles, SizeStyle } from './shape-style.js';

export type ShapeType = 'rect' | 'triangle';

export class ShapeElement extends BaseElement {
  type = 'shape' as const;
  path: Path2D;
  shapeType: ShapeType;
  color: `#${string}` = '#000000';
  constructor(id: string, shapeType: ShapeType) {
    super(id);
    this.shapeType = shapeType;

    const path = new Path2D();
    this.path = path;
  }

  setBound(x: number, y: number, w: number, h: number): void {
    super.setBound(x, y, w, h);

    // temp workaround
    if (this.shapeType === 'rect') {
      const path = new Path2D();
      path.rect(0, 0, w, h);
      this.path = path;
    }

    const shapeStyles: ShapeStyles = {
      color: this.color,
      dash: DashStyle.Draw,
      size: SizeStyle.Small,
    };
    const size = [w, h];
    const path = getRectanglePath(this.id, shapeStyles, size);
    this.path = path;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fill(this.path);
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
    element.color = data.color as `#${string}`;
    return element;
  }
}
