import type { Y } from '@blocksuite/store';

import type {
  CanvasTextFontFamily,
  CanvasTextFontStyle,
  CanvasTextFontWeight,
} from '../../consts.js';
import type { PhasorElementType } from '../edgeless-element.js';
import {
  type ISurfaceElement,
  type ISurfaceElementLocalRecord,
} from '../surface-element.js';

export interface IText extends ISurfaceElement {
  type: PhasorElementType.TEXT;

  text: Y.Text;
  color: string;
  fontSize: number;
  fontFamily: CanvasTextFontFamily;
  fontWeight?: CanvasTextFontWeight;
  fontStyle?: CanvasTextFontStyle;
  textAlign: 'left' | 'center' | 'right';
  hasMaxWidth?: boolean;
}

export interface ITextDelta {
  insert: string;
  attributes?: {
    [k: string]: unknown;
  };
}

export interface ITextLocalRecord extends ISurfaceElementLocalRecord {
  fontSize: number;
  hasMaxWidth: boolean;
}
