import type { IBound } from '../consts.js';

export type XYWH = [number, number, number, number];

export function serializeXYWH(x: number, y: number, w: number, h: number) {
  return `[${x},${y},${w},${h}]`;
}

export function deserializeXYWH(xywh: string): XYWH {
  return JSON.parse(xywh) as XYWH;
}

export function setXYWH(element: IBound, bound: IBound) {
  element.x = bound.x;
  element.y = bound.y;
  element.w = bound.w;
  element.h = bound.h;
}
