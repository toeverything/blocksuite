import { StrokeStyle } from '../../consts.js';
import type { IElementDefaultProps } from '../index.js';

export const ShapeElementDefaultProps: IElementDefaultProps<'shape'> = {
  type: 'shape',
  xywh: '[0,0,0,0]',

  rotate: 0,

  shapeType: 'rect',
  radius: 0,
  filled: false,
  fillColor: '#ffffff',
  strokeWidth: 4,
  strokeColor: '#000000',
  strokeStyle: StrokeStyle.Solid,
  roughness: 2,
};

export enum SHAPE_TEXT_FONT_SIZE {
  SMALL = 12,
  MEDIUM = 20,
  LARGE = 28,
  XLARGE = 36,
}

export const SHAPE_TEXT_PADDING = 20;
