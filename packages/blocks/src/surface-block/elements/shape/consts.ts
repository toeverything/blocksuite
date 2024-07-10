import type { StrokeStyle } from '../../consts.js';

import { createZodUnion } from '../../../_common/utils/index.js';

export enum ShapeType {
  Diamond = 'diamond',
  Ellipse = 'ellipse',
  Rect = 'rect',
  Triangle = 'triangle',
}

export enum SHAPE_TEXT_FONT_SIZE {
  LARGE = 28,
  MEDIUM = 20,
  SMALL = 12,
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
  '--affine-palette-shape-red',
  '--affine-palette-shape-magenta',
  '--affine-palette-shape-purple',
  '--affine-palette-shape-blue',
  '--affine-palette-shape-teal',
  '--affine-palette-shape-green',
  '--affine-palette-shape-black',
  '--affine-palette-shape-grey',
  '--affine-palette-shape-white',
] as const;

export const DEFAULT_SHAPE_FILL_COLOR = FILL_COLORS[0];

export const FillColorsSchema = createZodUnion(FILL_COLORS);

export const STROKE_COLORS = [
  '--affine-palette-line-yellow',
  '--affine-palette-line-orange',
  '--affine-palette-line-red',
  '--affine-palette-line-magenta',
  '--affine-palette-line-purple',
  '--affine-palette-line-blue',
  '--affine-palette-line-teal',
  '--affine-palette-line-green',
  '--affine-palette-line-black',
  '--affine-palette-line-grey',
  '--affine-palette-line-white',
] as const;

export const DEFAULT_SHAPE_STROKE_COLOR = STROKE_COLORS[0];

export const DEFAULT_SHAPE_TEXT_COLOR = STROKE_COLORS[8];

export const StrokeColorsSchema = createZodUnion(STROKE_COLORS);
