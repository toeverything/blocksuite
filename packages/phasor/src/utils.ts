import { Bound, GRID_SIZE } from './consts.js';

export function intersects(a: Bound, b: Bound): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

export function isPointIn(a: Bound, x: number, y: number): boolean {
  return a.x < x && x <= a.x + a.w && a.y < y && y <= a.y + a.h;
}

export function isOverlap(a: Bound, b: Bound): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

export function getGridIndex(val: number) {
  return Math.ceil(val / GRID_SIZE) - 1;
}

export function rangeFromBound(a: Bound): number[] {
  const minRow = getGridIndex(a.x);
  const maxRow = getGridIndex(a.x + a.w);
  const minCol = getGridIndex(a.y);
  const maxCol = getGridIndex(a.y + a.h);
  return [minRow, maxRow, minCol, maxCol];
}
