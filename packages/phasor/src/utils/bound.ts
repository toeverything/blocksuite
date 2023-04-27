import type { IBound } from '../consts.js';
import { Utils } from './tl-utils.js';
import { deserializeXYWH, serializeXYWH } from './xywh.js';

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

  serialize() {
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

export function getCommonBound(bounds: IBound[]): IBound | null {
  if (bounds.length < 2) return bounds[0] ?? null;

  let result = bounds[0];

  for (let i = 1; i < bounds.length; i++) {
    result = getExpandedBound(result, bounds[i]);
  }

  return result;
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
