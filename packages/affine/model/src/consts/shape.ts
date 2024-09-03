import { z } from 'zod';

import { LINE_COLORS, LineColor } from './line.js';

export const DEFAULT_ROUGHNESS = 1.4;

// TODO: need to check the default central area ratio
export const DEFAULT_CENTRAL_AREA_RATIO = 0.3;

export enum ShapeTextFontSize {
  LARGE = 28,
  MEDIUM = 20,
  SMALL = 12,
  XLARGE = 36,
}

export enum ShapeType {
  Diamond = 'diamond',
  Ellipse = 'ellipse',
  Rect = 'rect',
  Triangle = 'triangle',
}

export type ShapeName = ShapeType | 'roundedRect';

export function getShapeName(type: ShapeType, radius: number): ShapeName {
  if (type === ShapeType.Rect && radius > 0) {
    return 'roundedRect';
  }
  return type;
}

export function getShapeType(name: ShapeName): ShapeType {
  if (name === 'roundedRect') {
    return ShapeType.Rect;
  }
  return name;
}

export function getShapeRadius(name: ShapeName): number {
  if (name === 'roundedRect') {
    return 0.1;
  }
  return 0;
}

export enum ShapeStyle {
  General = 'General',
  Scribbled = 'Scribbled',
}

export enum ShapeFillColor {
  Black = '--affine-palette-shape-black',
  Blue = '--affine-palette-shape-blue',
  Green = '--affine-palette-shape-green',
  Grey = '--affine-palette-shape-grey',
  Magenta = '--affine-palette-shape-magenta',
  Orange = '--affine-palette-shape-orange',
  Purple = '--affine-palette-shape-purple',
  Red = '--affine-palette-shape-red',
  Teal = '--affine-palette-shape-teal',
  White = '--affine-palette-shape-white',
  Yellow = '--affine-palette-shape-yellow',
}

export const SHAPE_FILL_COLORS = [
  ShapeFillColor.Yellow,
  ShapeFillColor.Orange,
  ShapeFillColor.Red,
  ShapeFillColor.Magenta,
  ShapeFillColor.Purple,
  ShapeFillColor.Blue,
  ShapeFillColor.Teal,
  ShapeFillColor.Green,
  ShapeFillColor.Black,
  ShapeFillColor.Grey,
  ShapeFillColor.White,
] as const;

export const DEFAULT_SHAPE_FILL_COLOR = ShapeFillColor.Yellow;

export const FillColorsSchema = z.nativeEnum(ShapeFillColor);

export const SHAPE_STROKE_COLORS = LINE_COLORS;

export const DEFAULT_SHAPE_STROKE_COLOR = LineColor.Yellow;

export const DEFAULT_SHAPE_TEXT_COLOR = LineColor.Black;

export const StrokeColorsSchema = z.nativeEnum(LineColor);
