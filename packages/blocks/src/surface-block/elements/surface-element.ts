import type { SerializedXYWH } from '@blocksuite/global/utils';

import type { CanvasElementType } from '../element-model/index.js';

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
