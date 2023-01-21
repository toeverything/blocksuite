import { isPointIn } from './utils.js';

const BLACK = '#000000';

interface HitTestOptions {
  expandStroke: boolean;
  fillHollow: boolean;
}

abstract class BaseElement {
  abstract type: string;
  id: string;
  index!: string;
  x = 0;
  y = 0;
  w = 0;
  h = 0;

  constructor(id: string) {
    this.id = id;
  }

  get centerX() {
    return this.x + this.w / 2;
  }

  get centerY() {
    return this.y + this.h / 2;
  }

  setBound(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  abstract hitTest(x: number, y: number, options?: HitTestOptions): boolean;

  abstract render(_: CanvasRenderingContext2D): void;

  abstract serialize(): Record<string, unknown>;
}

export type ShapeType = 'rect' | 'triangle';

export class ShapeElement extends BaseElement {
  type = 'shape' as const;
  path: Path2D;
  shapeType: ShapeType;
  color = BLACK;
  constructor(id: string, shapeType: ShapeType) {
    super(id);
    this.shapeType = shapeType;

    const path = new Path2D();
    this.path = path;
  }

  hitTest(x: number, y: number, options?: HitTestOptions) {
    return isPointIn(this, x, y);
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

  setBound(x: number, y: number, w: number, h: number) {
    super.setBound(x, y, w, h);
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

export class DebugElement extends BaseElement {
  type = 'debug' as const;
  color = BLACK;

  hitTest(x: number, y: number, options?: HitTestOptions) {
    return isPointIn(this, x, y);
  }

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

export type Element = ShapeElement | DebugElement;

export type ElementType = Element['type'];
