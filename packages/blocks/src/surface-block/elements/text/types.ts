import type { Y } from '@blocksuite/store';

import type {
  CanvasTextFontFamily,
  CanvasTextFontStyle,
  CanvasTextFontWeight,
} from '../../consts.js';
import type { TextAlign } from '../consts.js';
import type { CanvasElementType } from '../edgeless-element.js';
import { type ISurfaceElement } from '../surface-element.js';

export interface IText extends ISurfaceElement {
  type: CanvasElementType.TEXT;

  text: Y.Text;
  color: string;
  fontSize: number;
  fontFamily: CanvasTextFontFamily;
  fontWeight?: CanvasTextFontWeight;
  fontStyle?: CanvasTextFontStyle;
  textAlign: TextAlign;
  hasMaxWidth?: boolean;

  // outdated, use `fontWeight` and `fontStyle` instead
  // bold: boolean;
  // italic: boolean;
}

export interface ITextDelta {
  insert: string;
  attributes?: {
    [k: string]: unknown;
  };
}
