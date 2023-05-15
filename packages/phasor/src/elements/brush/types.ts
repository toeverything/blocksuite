import type { SerializedXYWH } from '../../utils/xywh.js';

export interface IBrush {
  id: string;
  index: string;
  type: string;
  xywh: SerializedXYWH;
  seed: number;

  // [[x0,y0],[x1,y1]...]
  points: number[][];
  color: string;
  lineWidth: number;
}
