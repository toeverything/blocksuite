import { DEFAULT_ROUGHNESS, ShapeStyle, StrokeStyle } from '../../consts.js';
import {
  CanvasElementType,
  type IElementDefaultProps,
} from '../edgeless-element.js';

export const ShapeElementDefaultProps: IElementDefaultProps<'shape'> = {
  type: CanvasElementType.SHAPE,
  xywh: '[0,0,0,0]',

  rotate: 0,

  shapeType: 'rect',
  shapeStyle: ShapeStyle.General,
  radius: 0,
  filled: false,
  fillColor: '#ffffff',
  strokeWidth: 4,
  strokeColor: '#000000',
  strokeStyle: StrokeStyle.Solid,
  roughness: DEFAULT_ROUGHNESS,
};

export enum SHAPE_TEXT_FONT_SIZE {
  SMALL = 12,
  MEDIUM = 20,
  LARGE = 28,
  XLARGE = 36,
}

export const SHAPE_TEXT_PADDING = 20;

export interface GeneralShapeOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth: number;
  strokeColor: string;
  fillColor: string;
  strokeStyle: StrokeStyle;
  radius?: number;
}
