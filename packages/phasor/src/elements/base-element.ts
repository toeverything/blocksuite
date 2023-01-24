export interface SurfaceElement {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export abstract class BaseElement implements SurfaceElement {
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
