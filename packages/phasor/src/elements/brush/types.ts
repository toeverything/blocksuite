import type { ISurfaceElement } from '../surface-element.js';

export interface IBrush extends ISurfaceElement {
  type: 'brush';

  // [[x0,y0],[x1,y1]...]
  points: number[][];
  color: string;
  lineWidth: number;
}
