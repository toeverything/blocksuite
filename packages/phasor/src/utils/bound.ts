import type { IBound } from '../consts.js';
import { EPSILON, getBoundsFromPoints, lineIntersects } from './math-utils.js';
import type { IVec } from './vec.js';
import { deserializeXYWH, type SerializedXYWH, serializeXYWH } from './xywh.js';

export class Bound implements IBound {
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(x = 0, y = 0, w = 0, h = 0) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  static from(arg1: IBound) {
    return new Bound(arg1.x, arg1.y, arg1.w, arg1.h);
  }

  static fromDOMRect({ left, top, width, height }: DOMRect) {
    return new Bound(left, top, width, height);
  }

  static fromPoints(points: IVec[]) {
    const { minX, minY, maxX, maxY } = getBoundsFromPoints(points);
    return new Bound(minX, minY, maxX - minX, maxY - minY);
  }

  get points(): IVec[] {
    return [
      [this.x, this.y],
      [this.x + this.w, this.y],
      [this.x + this.w, this.y + this.h],
      [this.x, this.y + this.h],
    ];
  }

  get midPoints(): IVec[] {
    return [
      [this.x + this.w / 2, this.y],
      [this.x + this.w, this.y + this.h / 2],
      [this.x + this.w / 2, this.y + this.h],
      [this.x, this.y + this.h / 2],
    ];
  }

  get center(): IVec {
    return [this.x + this.w / 2, this.y + this.h / 2];
  }

  get minX() {
    return this.x;
  }

  get minY() {
    return this.y;
  }

  get maxX() {
    return this.x + this.w;
  }

  get maxY() {
    return this.y + this.h;
  }

  get tl(): IVec {
    return [this.x, this.y];
  }

  get tr() {
    return [this.x + this.w, this.y];
  }

  get bl() {
    return [this.x, this.y + this.h];
  }

  get br() {
    return [this.x + this.w, this.y + this.h];
  }

  get verticalLine(): IVec[] {
    return [
      [this.x + this.w / 2, this.y],
      [this.x + this.w / 2, this.y + this.h],
    ];
  }

  get horizontalLine(): IVec[] {
    return [
      [this.x, this.y + this.h / 2],
      [this.x + this.w, this.y + this.h / 2],
    ];
  }

  get upperLine(): IVec[] {
    return [
      [this.x, this.y],
      [this.x + this.w, this.y],
    ];
  }

  get lowerLine(): IVec[] {
    return [
      [this.x, this.y + this.h],
      [this.x + this.w, this.y + this.h],
    ];
  }

  get leftLine(): IVec[] {
    return [
      [this.x, this.y],
      [this.x, this.y + this.h],
    ];
  }

  get rightLine(): IVec[] {
    return [
      [this.x + this.w, this.y],
      [this.x + this.w, this.y + this.h],
    ];
  }

  containsPoint([x, y]: IVec): boolean {
    const { minX, minY, maxX, maxY } = this;
    return minX <= x && x <= maxX && minY <= y && y <= maxY;
  }

  intersectLine(sp: IVec, ep: IVec, infinite = false) {
    const rst: IVec[] = [];
    [
      [this.tl, this.tr],
      [this.tl, this.bl],
      [this.tr, this.br],
      [this.bl, this.br],
    ].forEach(([p1, p2]) => {
      const p = lineIntersects(sp, ep, p1, p2, infinite);
      if (p) rst.push(p);
    });
    return rst.length === 0 ? null : rst;
  }

  isIntersectWithBound(bound: Bound, epsilon = EPSILON) {
    return (
      bound.maxX > this.minX - epsilon &&
      bound.maxY > this.minY - epsilon &&
      bound.minX < this.maxX + epsilon &&
      bound.minY < this.maxY + epsilon
    );
  }

  unite(bound: Bound) {
    const x1 = Math.min(this.x, bound.x),
      y1 = Math.min(this.y, bound.y),
      x2 = Math.max(this.maxX, bound.maxX),
      y2 = Math.max(this.maxY, bound.maxY);
    return new Bound(x1, y1, x2 - x1, y2 - y1);
  }

  include(point: IVec) {
    const x1 = Math.min(this.x, point[0]),
      y1 = Math.min(this.y, point[1]),
      x2 = Math.max(this.maxX, point[0]),
      y2 = Math.max(this.maxY, point[1]);
    return new Bound(x1, y1, x2 - x1, y2 - y1);
  }

  getRelativePoint([x, y]: IVec): IVec {
    return [this.x + x * this.w, this.y + y * this.h];
  }

  toRelative([x, y]: IVec): IVec {
    return [(x - this.x) / this.w, (y - this.y) / this.h];
  }

  serialize(): SerializedXYWH {
    return serializeXYWH(this.x, this.y, this.w, this.h);
  }

  clone(): Bound {
    return new Bound(this.x, this.y, this.w, this.h);
  }

  isHorizontalCross(bound: Bound) {
    return !(this.maxY < bound.minY || this.minY > bound.maxY);
  }

  isVerticalCross(bound: Bound) {
    return !(this.maxX < bound.minX || this.minX > bound.maxX);
  }

  horizontalDistance(bound: Bound) {
    return Math.min(
      Math.abs(this.minX - bound.maxX),
      Math.abs(this.maxX - bound.minX)
    );
  }

  verticalDistance(bound: Bound) {
    return Math.min(
      Math.abs(this.minY - bound.maxY),
      Math.abs(this.maxY - bound.minY)
    );
  }

  expand(
    left: number,
    top: number = left,
    right: number = left,
    bottom: number = left
  ) {
    return new Bound(
      this.x - left,
      this.y - top,
      this.w + left + right,
      this.h + top + bottom
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

  contains(bound: Bound) {
    return (
      bound.x >= this.x &&
      bound.y >= this.y &&
      bound.maxX <= this.maxX &&
      bound.maxY <= this.maxY
    );
  }

  getVerticesAndMidpoints() {
    return [...this.points, ...this.midPoints];
  }

  static deserialize(s: string) {
    const [x, y, w, h] = deserializeXYWH(s);
    return new Bound(x, y, w, h);
  }
}

function getExpandedBound(a: IBound, b: IBound): IBound {
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.w, b.x + b.w);
  const maxY = Math.max(a.y + a.h, b.y + b.h);
  const width = Math.abs(maxX - minX);
  const height = Math.abs(maxY - minY);

  return {
    x: minX,
    y: minY,
    w: width,
    h: height,
  };
}

export function getCommonBound(bounds: IBound[]): Bound | null {
  if (!bounds.length) {
    return null;
  }
  if (bounds.length === 1) {
    const { x, y, w, h } = bounds[0];
    return new Bound(x, y, w, h);
  }

  let result = bounds[0];

  for (let i = 1; i < bounds.length; i++) {
    result = getExpandedBound(result, bounds[i]);
  }

  return new Bound(result.x, result.y, result.w, result.h);
}

/**
 * Get whether A contains B
 */
export function contains(a: IBound, b: IBound): boolean {
  return (
    a.x <= b.x && a.x + a.w >= b.x + b.w && a.y <= b.y && a.y + a.h >= b.y + b.h
  );
}

export function getBoundFromPoints(points: number[][]) {
  const { minX, minY, width, height } = getBoundsFromPoints(points);
  return new Bound(minX, minY, width, height);
}

export function inflateBound(bound: IBound, delta: number) {
  const half = delta / 2;

  const newBound = new Bound(
    bound.x - half,
    bound.y - half,
    bound.w + delta,
    bound.h + delta
  );

  if (newBound.w <= 0 || newBound.h <= 0) {
    throw new Error('Invalid delta range or bound size.');
  }

  return newBound;
}

export function transformPointsToNewBound<T extends { x: number; y: number }>(
  points: T[],
  oldBound: IBound,
  oldMargin: number,
  newBound: IBound,
  newMargin: number
) {
  const wholeOldMargin = oldMargin * 2;
  const wholeNewMargin = newMargin * 2;
  const oldW = Math.max(oldBound.w - wholeOldMargin, 1);
  const oldH = Math.max(oldBound.h - wholeOldMargin, 1);
  const newW = Math.max(newBound.w - wholeNewMargin, 1);
  const newH = Math.max(newBound.h - wholeNewMargin, 1);

  const transformedPoints = points.map(p => {
    return {
      ...p,
      x: newW * ((p.x - oldMargin) / oldW) + newMargin,
      y: newH * ((p.y - oldMargin) / oldH) + newMargin,
    } as T;
  });

  return {
    points: transformedPoints,
    bound: new Bound(
      newBound.x,
      newBound.y,
      newW + wholeNewMargin,
      newH + wholeNewMargin
    ),
  };
}
