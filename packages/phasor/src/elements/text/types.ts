import type * as Y from 'yjs';

import type { SerializedXYWH } from '../../utils/xywh.js';

export interface IText {
  id: string;
  index: string;
  type: 'text';
  xywh: SerializedXYWH;
  seed: number;
  rotate: number;
  flipX: 1 | -1;
  flipY: 1 | -1;

  text: Y.Text;
  color: string;
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface ITextDelta {
  insert: string;
  attributes?: {
    [k: string]: unknown;
  };
}
