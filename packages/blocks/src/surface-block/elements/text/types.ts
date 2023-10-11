import type { Y } from '@blocksuite/store';

import type { PhasorElementType } from '../edgeless-element.js';
import { type ISurfaceElement } from '../surface-element.js';

export interface IText extends ISurfaceElement {
  type: PhasorElementType.TEXT;

  text: Y.Text;
  color: string;
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
  maxWidth?: number;
}

export interface ITextDelta {
  insert: string;
  attributes?: {
    [k: string]: unknown;
  };
}
