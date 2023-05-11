import type { IText } from './types.js';

export const TextElementDefaultProps: Omit<IText, 'id' | 'index'> = {
  type: 'text',
  xywh: '[0,0,0,0]',

  text: '',
  color: '#000000',
  fontSize: 16,
  fontFamily: 'sans-serif',
  textAlign: 'center',
  lineHeight: 1.2,
};
