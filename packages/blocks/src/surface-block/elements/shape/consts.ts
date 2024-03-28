import { z } from 'zod';

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

export const FillColorsSchema = z.union([
  z.literal('--affine-palette-shape-yellow'),
  z.literal('--affine-palette-shape-orange'),
  z.literal('--affine-palette-shape-tangerine'),
  z.literal('--affine-palette-shape-red'),
  z.literal('--affine-palette-shape-magenta'),
  z.literal('--affine-palette-shape-purple'),
  z.literal('--affine-palette-shape-green'),
  z.literal('--affine-palette-shape-blue'),
  z.literal('--affine-palette-shape-navy'),
  z.literal('--affine-palette-shape-black'),
  z.literal('--affine-palette-shape-white'),
  z.literal('--affine-palette-transparent'),
]);

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

export const StrokeColorsSchema = z.union([
  z.literal('--affine-palette-line-yellow'),
  z.literal('--affine-palette-line-orange'),
  z.literal('--affine-palette-line-tangerine'),
  z.literal('--affine-palette-line-red'),
  z.literal('--affine-palette-line-magenta'),
  z.literal('--affine-palette-line-purple'),
  z.literal('--affine-palette-line-green'),
  z.literal('--affine-palette-line-blue'),
  z.literal('--affine-palette-line-navy'),
  z.literal('--affine-palette-line-black'),
  z.literal('--affine-palette-line-white'),
  z.literal('--affine-palette-transparent'),
]);
