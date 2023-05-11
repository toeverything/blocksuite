import { StrokeStyle } from '../../consts.js';
import type { IShape } from './types.js';

export const ShapeElementDefaultProps: Omit<IShape, 'id' | 'index'> = {
  type: 'shape',
  xywh: '[0,0,0,0]',

  shapeType: 'rect',
  radius: 0,
  filled: false,
  fillColor: '#ffffff',
  strokeWidth: 4,
  strokeColor: '#000000',
  strokeStyle: StrokeStyle.Solid,
};
