import type { ElementDefaultProps } from '../index.js';

export const TextElementDefaultProps: ElementDefaultProps<'text'> = {
  type: 'text',
  xywh: '[0,0,0,0]',

  text: '',
  color: '#000000',
  fontSize: 16,
  fontFamily: 'sans-serif',
  textAlign: 'center',
  lineHeight: 1.2,
};
