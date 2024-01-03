import type { Y } from '@blocksuite/store';

import type { SerializedXYWH } from '../index.js';
import { type BaseProps, ElementModel } from './base.js';
import type { FontFamily, FontStyle, FontWeight } from './common.js';
import { yfield } from './decorators.js';

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
  @yfield()
  xywh: SerializedXYWH = '[0,0,0,0]';

  @yfield()
  rotate: number = 0;

  @yfield()
  text!: Y.Text;

  @yfield()
  color!: string;

  @yfield()
  fontSize!: number;

  @yfield()
  fontFamily!: FontFamily;

  @yfield()
  fontWeight?: FontWeight;

  @yfield()
  fontStyle?: FontStyle;

  @yfield()
  textAlign!: 'left' | 'center' | 'right';

  @yfield()
  hasMaxWidth?: boolean;

  get type() {
    return 'text';
  }
}
