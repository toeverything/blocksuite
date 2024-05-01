import { createZodUnion } from '../../../_common/utils/index.js';
import type { StrokeStyle } from '../../consts.js';

export enum ShapeType {
  Rect = 'rect',
  Triangle = 'triangle',
  Ellipse = 'ellipse',
  Diamond = 'diamond',
}

export enum SHAPE_TEXT_FONT_SIZE {
  SMALL = 12,
  MEDIUM = 20,
  LARGE = 28,
  XLARGE = 36,
}

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
export const FILL_COLORS = [
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
] as const;
export const DEFAULT_SHAPE_FILL_COLOR = FILL_COLORS[0];

export const FillColorsSchema = createZodUnion(FILL_COLORS);

export const STROKE_COLORS = [
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
] as const;

export const DEFAULT_SHAPE_STROKE_COLOR = STROKE_COLORS[0];

export const DEFAULT_SHAPE_TEXT_COLOR = STROKE_COLORS[9];

export const StrokeColorsSchema = createZodUnion(STROKE_COLORS);
