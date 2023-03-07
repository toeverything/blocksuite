import type { IBound } from '../consts.js';

export function isPointIn(a: IBound, x: number, y: number): boolean {
  return a.x <= x && x <= a.x + a.w && a.y <= y && y <= a.y + a.h;
}

export function intersects(a: IBound, b: IBound): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}
