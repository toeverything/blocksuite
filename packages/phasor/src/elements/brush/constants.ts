import type { IElementDefaultProps } from '../index.js';

export const BrushElementDefaultProps: IElementDefaultProps<'brush'> = {
  type: 'brush',
  xywh: '[0,0,0,0]',

  points: [],
  color: '#000000',
  lineWidth: 4,
};
