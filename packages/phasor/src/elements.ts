const BLACK = '#000000';

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

  abstract render(_: CanvasRenderingContext2D): void;

  abstract serialize(): Record<string, unknown>;
}

export class PathElement extends BaseElement {
  type = 'path' as const;
  path: Path2D;
  color = BLACK;
  points: number[] = [];
  constructor(id: string, points: number[]) {
    super(id);
    this.points = points;
    const path = new Path2D();
    path.moveTo(0, 0);
    for (let i = 0; i < points.length; i += 2) {
      path.lineTo(points[i], points[i + 1]);
    }
    path.closePath();
    this.path = path;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.fill(this.path);
    ctx.strokeRect(0, 0, this.w, this.h);
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      xywh: `${this.x},${this.y},${this.w},${this.h}`,
      color: this.color,
      points: this.points.join(','),
    };
  }

  static deserialize(data: Record<string, unknown>): PathElement {
    const points = (data.points as string).split(',').map(v => Number(v));
    const element = new PathElement(data.id as string, points);
    element.index = data.index as string;

    const [x, y, w, h] = (data.xywh as string).split(',').map(v => Number(v));
    element.setBound(x, y, w, h);
    element.color = data.color as string;
    return element;
  }
}

export class RectElement extends BaseElement {
  type = 'rect' as const;
  color = BLACK;

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

  static deserialize(data: Record<string, unknown>): RectElement {
    const element = new RectElement(data.id as string);
    element.index = data.index as string;

    const [x, y, w, h] = (data.xywh as string).split(',').map(v => Number(v));
    element.setBound(x, y, w, h);
    element.color = data.color as string;
    return element;
  }
}

export type Element = PathElement | RectElement;
