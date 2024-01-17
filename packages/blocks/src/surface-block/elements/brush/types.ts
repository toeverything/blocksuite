import type { CanvasElementType } from '../../element-model/index.js';
import type { ISurfaceElement } from '../surface-element.js';

export interface IBrush extends ISurfaceElement {
  type: CanvasElementType.BRUSH;

  // [[x0,y0],[x1,y1]...]
  points: number[][];
  color: string;
  lineWidth: number;
}
