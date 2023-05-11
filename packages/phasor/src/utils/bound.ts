import type { IBound } from '../consts.js';
import { Utils } from './tl-utils.js';
import { deserializeXYWH, type SerializedXYWH, serializeXYWH } from './xywh.js';

export class Bound implements IBound {
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  serialize(): SerializedXYWH {
    return serializeXYWH(this.x, this.y, this.w, this.h);
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
  const { minX, minY, width, height } = Utils.getBoundsFromPoints(points);
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
