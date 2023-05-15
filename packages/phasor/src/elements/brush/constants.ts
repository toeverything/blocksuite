import type { IBrush } from './types.js';

export const BrushElementDefaultProps: Omit<IBrush, 'id' | 'index'> = {
  type: 'brush',
  xywh: '[0,0,0,0]',

  points: [],
  color: '#000000',
  lineWidth: 4,
};
