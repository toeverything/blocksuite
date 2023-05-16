import { StrokeStyle } from '../../consts.js';
import type { ElementDefaultProps } from '../index.js';

export const ShapeElementDefaultProps: ElementDefaultProps<'shape'> = {
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
