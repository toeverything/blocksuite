import type { SerializedXYWH, XYWH } from '../xywh.js';
import type { IVec } from './vec.js';

import {
  EPSILON,
  getBoundsFromPoints,
  lineIntersects,
  polygonPointDistance,
} from '../math.js';
import { deserializeXYWH, serializeXYWH } from '../xywh.js';

/**
 * Represents the x, y, width, and height of a block that can be easily accessed.
 */
export interface IBound {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
}

export class Bound implements IBound {
  h: number;

  w: number;

  x: number;

  y: number;

  get bl() {
    return [this.x, this.y + this.h];
  }

  get br() {
    return [this.x + this.w, this.y + this.h];
  }

  get center(): IVec {
    return [this.x + this.w / 2, this.y + this.h / 2];
  }

  set center([cx, cy]: IVec) {
    const [px, py] = this.center;
    this.x += cx - px;
    this.y += cy - py;
  }

  get horizontalLine(): IVec[] {
    return [
      [this.x, this.y + this.h / 2],
      [this.x + this.w, this.y + this.h / 2],
    ];
  }

  get leftLine(): IVec[] {
    return [
      [this.x, this.y],
      [this.x, this.y + this.h],
    ];
  }

  get lowerLine(): IVec[] {
    return [
      [this.x, this.y + this.h],
      [this.x + this.w, this.y + this.h],
    ];
  }

  get maxX() {
    return this.x + this.w;
  }

  get maxY() {
    return this.y + this.h;
  }

  get midPoints(): IVec[] {
    return [
      [this.x + this.w / 2, this.y],
      [this.x + this.w, this.y + this.h / 2],
      [this.x + this.w / 2, this.y + this.h],
      [this.x, this.y + this.h / 2],
    ];
  }

  get minX() {
    return this.x;
  }

  get minY() {
    return this.y;
  }

  get points(): IVec[] {
    return [
      [this.x, this.y],
      [this.x + this.w, this.y],
      [this.x + this.w, this.y + this.h],
      [this.x, this.y + this.h],
    ];
  }

  get rightLine(): IVec[] {
    return [
      [this.x + this.w, this.y],
      [this.x + this.w, this.y + this.h],
    ];
  }

  get tl(): IVec {
    return [this.x, this.y];
  }

  get tr() {
    return [this.x + this.w, this.y];
  }

  get upperLine(): IVec[] {
    return [
      [this.x, this.y],
      [this.x + this.w, this.y],
    ];
  }

  get verticalLine(): IVec[] {
    return [
      [this.x + this.w / 2, this.y],
      [this.x + this.w / 2, this.y + this.h],
    ];
  }

  constructor(x = 0, y = 0, w = 0, h = 0) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  static deserialize(s: string) {
    const [x, y, w, h] = deserializeXYWH(s);
    return new Bound(x, y, w, h);
  }

  static from(arg1: IBound) {
    return new Bound(arg1.x, arg1.y, arg1.w, arg1.h);
  }

  static fromCenter(center: IVec, width: number, height: number) {
    const [x, y] = center;
    return new Bound(x - width / 2, y - height / 2, width, height);
  }

  static fromDOMRect({ left, top, width, height }: DOMRect) {
    return new Bound(left, top, width, height);
  }

  static fromPoints(points: IVec[]) {
    const { minX, minY, maxX, maxY } = getBoundsFromPoints(points);
    return new Bound(minX, minY, maxX - minX, maxY - minY);
  }

  static fromXYWH(xywh: XYWH) {
    return new Bound(xywh[0], xywh[1], xywh[2], xywh[3]);
  }

  static serialize(bound: IBound) {
    return serializeXYWH(bound.x, bound.y, bound.w, bound.h);
  }

  clone(): Bound {
    return new Bound(this.x, this.y, this.w, this.h);
  }

  contains(bound: Bound) {
    return (
      bound.x >= this.x &&
      bound.y >= this.y &&
      bound.maxX <= this.maxX &&
      bound.maxY <= this.maxY
    );
  }

  containsPoint([x, y]: IVec): boolean {
    const { minX, minY, maxX, maxY } = this;
    return minX <= x && x <= maxX && minY <= y && y <= maxY;
  }

  expand(
    left: number,
    top: number = left,
    right: number = left,
    bottom: number = top
  ) {
    return new Bound(
      this.x - left,
      this.y - top,
      this.w + left + right,
      this.h + top + bottom
    );
  }

  getRelativePoint([x, y]: IVec): IVec {
    return [this.x + x * this.w, this.y + y * this.h];
  }

  getVerticesAndMidpoints() {
    return [...this.points, ...this.midPoints];
  }

  horizontalDistance(bound: Bound) {
    return Math.min(
      Math.abs(this.minX - bound.maxX),
      Math.abs(this.maxX - bound.minX)
    );
  }

  include(point: IVec) {
    const x1 = Math.min(this.x, point[0]),
      y1 = Math.min(this.y, point[1]),
      x2 = Math.max(this.maxX, point[0]),
      y2 = Math.max(this.maxY, point[1]);
    return new Bound(x1, y1, x2 - x1, y2 - y1);
  }

  intersectLine(sp: IVec, ep: IVec, infinite = false) {
    const rst: IVec[] = [];
    (
      [
        [this.tl, this.tr],
        [this.tl, this.bl],
        [this.tr, this.br],
        [this.bl, this.br],
      ] as IVec[][]
    ).forEach(([p1, p2]) => {
      const p = lineIntersects(sp, ep, p1, p2, infinite);
      if (p) rst.push(p);
    });
    return rst.length === 0 ? null : rst;
  }

  isHorizontalCross(bound: Bound) {
    return !(this.maxY < bound.minY || this.minY > bound.maxY);
  }

  isIntersectWithBound(bound: Bound, epsilon = EPSILON) {
    return (
      bound.maxX > this.minX - epsilon &&
      bound.maxY > this.minY - epsilon &&
      bound.minX < this.maxX + epsilon &&
      bound.minY < this.maxY + epsilon &&
      !this.contains(bound) &&
      !bound.contains(this)
    );
  }

  isOverlapWithBound(bound: Bound, epsilon = EPSILON) {
    return (
      bound.maxX > this.minX - epsilon &&
      bound.maxY > this.minY - epsilon &&
      bound.minX < this.maxX + epsilon &&
      bound.minY < this.maxY + epsilon
    );
  }

  isPointInBound([x, y]: IVec, tolerance = 0.01) {
    return (
      x > this.minX + tolerance &&
      x < this.maxX - tolerance &&
      y > this.minY + tolerance &&
      y < this.maxY - tolerance
    );
  }

  isPointNearBound([x, y]: IVec, tolerance = 0.01) {
    return polygonPointDistance(this.points, [x, y]) < tolerance;
  }

  isVerticalCross(bound: Bound) {
    return !(this.maxX < bound.minX || this.minX > bound.maxX);
  }

  serialize(): SerializedXYWH {
    return serializeXYWH(this.x, this.y, this.w, this.h);
  }

  toRelative([x, y]: IVec): IVec {
    return [(x - this.x) / this.w, (y - this.y) / this.h];
  }

  toXYWH(): XYWH {
    return [this.x, this.y, this.w, this.h];
  }

  unite(bound: Bound) {
    const x1 = Math.min(this.x, bound.x),
      y1 = Math.min(this.y, bound.y),
      x2 = Math.max(this.maxX, bound.maxX),
      y2 = Math.max(this.maxY, bound.maxY);
    return new Bound(x1, y1, x2 - x1, y2 - y1);
  }

  verticalDistance(bound: Bound) {
    return Math.min(
      Math.abs(this.minY - bound.maxY),
      Math.abs(this.maxY - bound.minY)
    );
  }
}
