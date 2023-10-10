import { Workspace } from '@blocksuite/store';

import {
  type IElementDefaultProps,
  PhasorElementType,
} from '../edgeless-element.js';

export const TextElementDefaultProps: () => IElementDefaultProps<'text'> =
  () => ({
    type: PhasorElementType.TEXT,
    xywh: [0, 0, 0, 0],

    rotate: 0,

    text: new Workspace.Y.Text(),
    color: '#000000',
    fontSize: 16,
    fontFamily: "'Kalam', cursive",
    textAlign: 'center',
    bold: false,
    italic: false,
  });
