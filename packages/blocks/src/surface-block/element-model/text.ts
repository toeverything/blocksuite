import type { Y } from '@blocksuite/store';

import type { SerializedXYWH } from '../index.js';
import { type BaseProps, ElementModel } from './base.js';
import type { FontFamily, FontStyle, FontWeight } from './common.js';
import { ymap } from './decorators.js';

export type TextElementProps = BaseProps & {
  text: Y.Text;
  color: string;
  fontSize: number;
  fontFamily: FontFamily;
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  textAlign: 'left' | 'center' | 'right';
  hasMaxWidth?: boolean;
};

export class TextElementModel extends ElementModel<TextElementProps> {
  @ymap()
  xywh: SerializedXYWH = '[0,0,0,0]';

  @ymap()
  rotate: number = 0;

  @ymap()
  text!: Y.Text;

  @ymap()
  color!: string;

  @ymap()
  fontSize!: number;

  @ymap()
  fontFamily!: FontFamily;

  @ymap()
  fontWeight?: FontWeight;

  @ymap()
  fontStyle?: FontStyle;

  @ymap()
  textAlign!: 'left' | 'center' | 'right';

  @ymap()
  hasMaxWidth?: boolean;

  get type() {
    return 'text';
  }
}
