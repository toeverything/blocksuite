import { Workspace } from '@blocksuite/store';

import {
  CanvasTextFontFamily,
  CanvasTextFontStyle,
  CanvasTextFontWeight,
} from '../../consts.js';
import { TextAlign } from '../consts.js';
import { CanvasElementType } from '../edgeless-element.js';

export const TextElementDefaultProps = {
  type: CanvasElementType.TEXT,
  xywh: '[0,0,0,0]',

  rotate: 0,

  text: new Workspace.Y.Text(),
  color: '#000000',
  fontSize: 16,
  fontFamily: CanvasTextFontFamily.Inter,
  fontWeight: CanvasTextFontWeight.Regular,
  fontStyle: CanvasTextFontStyle.Normal,
  textAlign: TextAlign.Center,
};
