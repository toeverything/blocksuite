import type { SerializedXYWH } from '../../utils/xywh.js';

export interface IBrush {
  id: string;
  type: 'brush';
  xywh: SerializedXYWH;
  index: string;
  seed: number;

  // [[x0,y0],[x1,y1]...]
  points: number[][];
  color: string;
  lineWidth: number;
}
