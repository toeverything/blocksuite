import * as Y from 'yjs';

import type { IElementDefaultProps } from '../index.js';

export const TextElementDefaultProps: IElementDefaultProps<'text'> = {
  type: 'text',
  xywh: '[0,0,0,0]',

  text: new Y.Text(),
  color: '#000000',
  fontSize: 16,
  fontFamily: "'Kalam', cursive",
  textAlign: 'center',
};
