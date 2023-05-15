import type { ElementDefaultProps } from '../index.js';

export const BrushElementDefaultProps: ElementDefaultProps<'brush'> = {
  type: 'brush',
  xywh: '[0,0,0,0]',

  points: [],
  color: '#000000',
  lineWidth: 4,
};
