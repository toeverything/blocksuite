import { Utils } from './math-utils.js';
const { clamp } = Utils;
export interface IPoint {
  x: number;
  y: number;
}

export class Point {
  public x: number;
  public y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static from(point: IPoint | number[] | number, y?: number) {
    if (Array.isArray(point)) {
      return new Point(point[0], point[1]);
    }
    if (typeof point === 'number') {
      return new Point(point, y ?? point);
    }
    return new Point(point.x, point.y);
  }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  equals({ x, y }: Point) {
    return this.x === x && this.y === y;
  }

  add(point: IPoint): Point {
    return new Point(this.x + point.x, this.y + point.y);
  }

  scale(factor: number): Point {
    return new Point(this.x * factor, this.y * factor);
  }

  subtract(point: IPoint): Point {
    return new Point(this.x - point.x, this.y - point.y);
  }

  /**
   * Returns a copy of the point.
   */
  clone() {
    return new Point(this.x, this.y);
  }

  cross(point: IPoint): number {
    return this.x * point.y - this.y * point.x;
  }

  lerp(point: IPoint, t: number): Point {
    return new Point(
      this.x + (point.x - this.x) * t,
      this.y + (point.y - this.y) * t
    );
  }

  toArray() {
    return [this.x, this.y];
  }

  /**
   * Compares and returns the minimum of two points.
   */
  static min(a: IPoint, b: IPoint) {
    return new Point(Math.min(a.x, b.x), Math.min(a.y, b.y));
  }

  /**
   * Compares and returns the maximum of two points.
   */
  static max(a: IPoint, b: IPoint) {
    return new Point(Math.max(a.x, b.x), Math.max(a.y, b.y));
  }

  /**
   * Restrict a value to a certain interval.
   */
  static clamp(p: IPoint, min: IPoint, max: IPoint) {
    return new Point(clamp(p.x, min.x, max.x), clamp(p.y, min.y, max.y));
  }
}
