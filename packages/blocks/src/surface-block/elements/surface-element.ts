import type { CanvasElementType } from '../element-model/index.js';
import type { SerializedXYWH } from '../utils/xywh.js';

export interface ISurfaceElement {
  batch: null | string;
  id: string;
  index: string;
  // degree: [0, 360]
  rotate: number;
  seed: number;

  type: CanvasElementType;
  xywh: SerializedXYWH;
}
