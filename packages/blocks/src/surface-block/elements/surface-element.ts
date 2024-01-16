import { type SerializedXYWH } from '../utils/xywh.js';
import type { CanvasElementType } from './edgeless-element.js';

export interface ISurfaceElement {
  id: string;
  type: CanvasElementType;
  xywh: SerializedXYWH;
  index: string;
  seed: number;

  // degree: [0, 360]
  rotate: number;
  batch: string | null;
}

export type ComputedValue = (value: string) => string;
