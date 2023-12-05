import type { LineWidth } from '../../../index.js';
import type { CanvasElementType } from '../edgeless-element.js';
import type {
  ISurfaceElement,
  ISurfaceElementLocalRecord,
} from '../surface-element.js';

export interface IBrush extends ISurfaceElement {
  type: CanvasElementType.BRUSH;

  // [[x0,y0],[x1,y1]...]
  points: number[][];
  color: string;
  lineWidth: number;
}

export interface IBrushLocalRecord extends ISurfaceElementLocalRecord {
  points?: number[][];
  lineWidth?: LineWidth;
}
