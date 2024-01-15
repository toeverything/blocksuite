import { Workspace, type Y } from '@blocksuite/store';

import type { SerializedXYWH } from '../index.js';
import { type BaseProps, ElementModel } from './base.js';
import {
  FontFamily,
  type FontStyle,
  FontWeight,
  type TextAlign,
} from './common.js';
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
  static override propsToY(props: Record<string, unknown>) {
    if (props.text && !(props.text instanceof Workspace.Y.Text)) {
      props.text = new Workspace.Y.Text(props.text as string);
    }

    return props;
  }

  @yfield()
  xywh: SerializedXYWH = '[0,0,16,16]';

  @yfield()
  rotate: number = 0;

  @yfield()
  text: Y.Text = new Workspace.Y.Text();

  @yfield()
  color: string = '#000000';

  @yfield()
  fontSize: number = 16;

  @yfield()
  fontFamily: FontFamily = FontFamily.Inter;

  @yfield()
  fontWeight: FontWeight = FontWeight.Regular;

  @yfield()
  fontStyle: FontStyle = 'normal';

  @yfield()
  textAlign: TextAlign = 'center';

  @yfield()
  hasMaxWidth?: boolean;

  get type() {
    return 'text';
  }
}
