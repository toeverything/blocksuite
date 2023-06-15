import type * as Y from 'yjs';

import type { SerializedXYWH } from '../../utils/xywh.js';
import type { ISurfaceElementView } from '../surface-element.js';

export interface IText {
  id: string;
  index: string;
  type: 'text';
  xywh: SerializedXYWH;
  seed: number;

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

export interface ITextView extends Omit<ISurfaceElementView, 'type'>, IText {}
