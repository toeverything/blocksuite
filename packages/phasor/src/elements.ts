const BLACK = '#000000';
const TYPE_PATH = 'path';
const TYPE_IMAGE = 'image';

abstract class BaseElement {
  x = 0;
  y = 0;
  w = 0;
  h = 0;
  id: number;
  constructor(id: number) {
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
}

export class PathElement extends BaseElement {
  type = TYPE_PATH;
  path: Path2D;
  color = BLACK;
  points: number[] = [];
  constructor(id: number, points: number[]) {
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
}

export class RectElement extends BaseElement {
  type = TYPE_IMAGE;
  color = BLACK;
  constructor(id: number) {
    super(id);
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = this.color;
    ctx.strokeRect(0, 0, this.w, this.h);
  }
}

export type Element = PathElement | RectElement;
