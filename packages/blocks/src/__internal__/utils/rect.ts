import type { IPoint } from '../index.js';
import { clamp } from './std.js';

export class Point {
  public x: number;
  public y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  equals({ x, y }: Point) {
    return this.x === x && this.y === y;
  }

  xDistance({ x }: Point) {
    return this.x - x;
  }

  yDistance({ y }: Point) {
    return this.y - y;
  }

  xDistanceAbsolute(point: Point) {
    return Math.abs(this.xDistance(point));
  }

  yDistanceAbsolute(point: Point) {
    return Math.abs(this.yDistance(point));
  }

  distance(point: Point) {
    return Math.sqrt(
      Math.pow(this.xDistance(point), 2) + Math.pow(this.yDistance(point), 2)
    );
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

  toString() {
    return this.x + ',' + this.y;
  }

  /**
   * Returns a copy of the point.
   */
  clone() {
    return new Point(this.x, this.y);
  }

  /**
   * Compares and returns the minimum of two points.
   */
  static min(a: Point, b: Point) {
    return new Point(Math.min(a.x, b.x), Math.min(a.y, b.y));
  }

  /**
   * Compares and returns the maximum of two points.
   */
  static max(a: Point, b: Point) {
    return new Point(Math.max(a.x, b.x), Math.max(a.y, b.y));
  }

  /**
   * Restrict a value to a certain interval.
   */
  static clamp(p: Point, min: Point, max: Point) {
    return new Point(clamp(p.x, min.x, max.x), clamp(p.y, min.y, max.y));
  }
}

export class Rect {
  // `[left, top]`
  public min: Point;
  // `[right, bottom]`
  public max: Point;

  constructor(left: number, top: number, right: number, bottom: number) {
    const [minX, maxX] = left <= right ? [left, right] : [right, left];
    const [minY, maxY] = top <= bottom ? [top, bottom] : [bottom, top];
    this.min = new Point(minX, minY);
    this.max = new Point(maxX, maxY);
  }

  get width() {
    return this.max.x - this.min.x;
  }

  set width(w: number) {
    this.max.x = this.min.x + w;
  }

  get height() {
    return this.max.y - this.min.y;
  }

  set height(h: number) {
    this.max.y = this.min.y + h;
  }

  get left() {
    return this.min.x;
  }

  set left(x: number) {
    this.min.x = x;
  }

  get top() {
    return this.min.y;
  }

  set top(y: number) {
    this.min.y = y;
  }

  get right() {
    return this.max.x;
  }

  set right(x: number) {
    this.max.x = x;
  }

  get bottom() {
    return this.max.y;
  }

  set bottom(y: number) {
    this.max.y = y;
  }

  center() {
    return new Point(
      (this.left + this.right) / 2,
      (this.top + this.bottom) / 2
    );
  }

  extend_with(point: Point) {
    this.min = Point.min(this.min, point);
    this.max = Point.max(this.max, point);
  }

  extend_with_x(x: number) {
    this.min.x = Math.min(this.min.x, x);
    this.max.x = Math.max(this.max.x, x);
  }

  extend_with_y(y: number) {
    this.min.y = Math.min(this.min.y, y);
    this.max.y = Math.max(this.max.y, y);
  }

  equals({ min, max }: Rect) {
    return this.min.equals(min) && this.max.equals(max);
  }

  contains({ min, max }: Rect) {
    return this.isPointIn(min) && this.isPointIn(max);
  }

  intersects({ left, top, right, bottom }: Rect) {
    return (
      this.left <= right &&
      left <= this.right &&
      this.top <= bottom &&
      top <= this.bottom
    );
  }

  isPointIn({ x, y }: Point) {
    return (
      this.left <= x && x <= this.right && this.top <= y && y <= this.bottom
    );
  }

  isPointDown({ x, y }: Point) {
    return this.bottom < y && this.left <= x && this.right >= x;
  }

  isPointUp({ x, y }: Point) {
    return y < this.top && this.left <= x && this.right >= x;
  }

  isPointLeft({ x, y }: Point) {
    return x < this.left && this.top <= y && this.bottom >= y;
  }

  isPointRight({ x, y }: Point) {
    return x > this.right && this.top <= y && this.bottom >= y;
  }

  intersect(other: Rect) {
    return Rect.fromPoints(
      Point.max(this.min, other.min),
      Point.min(this.max, other.max)
    );
  }

  clamp(p: Point) {
    return Point.clamp(p, this.min, this.max);
  }

  clone() {
    const { left, top, right, bottom } = this;
    return new Rect(left, top, right, bottom);
  }

  toDOMRect() {
    const { left, top, width, height } = this;
    return new DOMRect(left, top, width, height);
  }

  static fromLTRB(left: number, top: number, right: number, bottom: number) {
    return new Rect(left, top, right, bottom);
  }

  static fromLWTH(left: number, width: number, top: number, height: number) {
    return new Rect(left, top, left + width, top + height);
  }

  static fromXY(x: number, y: number) {
    return Rect.fromPoint(new Point(x, y));
  }

  static fromPoint(point: Point) {
    return Rect.fromPoints(point.clone(), point);
  }

  static fromPoints(start: Point, end: Point) {
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    const left = Math.min(end.x, start.x);
    const top = Math.min(end.y, start.y);
    return Rect.fromLWTH(left, width, top, height);
  }

  static fromDOMRect({ left, top, right, bottom }: DOMRect) {
    return Rect.fromLTRB(left, top, right, bottom);
  }

  static fromDOM(dom: Element) {
    return Rect.fromDOMRect(dom.getBoundingClientRect());
  }
}
