import { Workspace } from '@blocksuite/store';

import { CanvasTextFont } from '../../../page-block/edgeless/utils/consts.js';
import {
  type IElementDefaultProps,
  PhasorElementType,
} from '../edgeless-element.js';

export const TextElementDefaultProps: IElementDefaultProps<'text'> = {
  type: PhasorElementType.TEXT,
  xywh: '[0,0,0,0]',

  rotate: 0,

  text: new Workspace.Y.Text(),
  color: '#000000',
  fontSize: 16,
  fontFamily: CanvasTextFont.Inter,
  textAlign: 'center',
  bold: false,
  italic: false,
};
