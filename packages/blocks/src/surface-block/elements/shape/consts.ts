import type { CssVariableName } from '../../../_common/theme/css-variables.js';
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
export const FILL_COLORS: CssVariableName[] = [
  '--affine-palette-shape-yellow',
  '--affine-palette-shape-orange',
  '--affine-palette-shape-tangerine',
  '--affine-palette-shape-red',
  '--affine-palette-shape-magenta',
  '--affine-palette-shape-purple',
  '--affine-palette-shape-green',
  '--affine-palette-shape-blue',
  '--affine-palette-shape-navy',
  '--affine-palette-shape-black',
  '--affine-palette-shape-white',
  '--affine-palette-transparent',
];
export const DEFAULT_SHAPE_FILL_COLOR = FILL_COLORS[0];
export const STROKE_COLORS: CssVariableName[] = [
  '--affine-palette-line-yellow',
  '--affine-palette-line-orange',
  '--affine-palette-line-tangerine',
  '--affine-palette-line-red',
  '--affine-palette-line-magenta',
  '--affine-palette-line-purple',
  '--affine-palette-line-green',
  '--affine-palette-line-blue',
  '--affine-palette-line-navy',
  '--affine-palette-line-black',
  '--affine-palette-line-white',
  '--affine-palette-transparent',
];
export const DEFAULT_SHAPE_STROKE_COLOR = STROKE_COLORS[0];
