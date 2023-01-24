/// <reference types="@blocksuite/global" />
import type { IBound } from './consts.js';

export { Renderer } from './renderer.js';
export * from './elements/index.js';
export * from './utils/debug-utils.js';
export * from './surface.js';

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
