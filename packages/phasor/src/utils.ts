import { IBound, GRID_SIZE } from './consts.js';
import type { Element } from './elements/index.js';

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
}

export function intersects(a: IBound, b: IBound): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

export function isPointIn(a: IBound, x: number, y: number): boolean {
  return a.x < x && x <= a.x + a.w && a.y < y && y <= a.y + a.h;
}

export function isOverlap(a: IBound, b: IBound): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

export function getGridIndex(val: number) {
  return Math.ceil(val / GRID_SIZE) - 1;
}

export function rangeFromBound(a: IBound): number[] {
  const minRow = getGridIndex(a.x);
  const maxRow = getGridIndex(a.x + a.w);
  const minCol = getGridIndex(a.y);
  const maxCol = getGridIndex(a.y + a.h);
  return [minRow, maxRow, minCol, maxCol];
}

export function compare(a: Element, b: Element): number {
  if (a.index > b.index) return 1;
  else if (a.index < b.index) return -1;
  return a.id > b.id ? 1 : -1;
}
