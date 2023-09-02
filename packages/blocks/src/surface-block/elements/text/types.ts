import type * as Y from 'yjs';

import type { ISurfaceElement } from '../surface-element.js';

export interface IText extends ISurfaceElement {
  type: 'text';

  text: Y.Text;
  color: string;
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
}

export interface ITextDelta {
  insert: string;
  attributes?: {
    [k: string]: unknown;
  };
}
