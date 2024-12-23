import { Black, Light, LIGHT_PALETTES, StrokeColor, White } from './color.js';

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

export const ShapeFillColor = { Black, White, ...Light } as const;

export const SHAPE_FILL_COLORS = [...LIGHT_PALETTES, Black, White];

export const DEFAULT_SHAPE_FILL_COLOR = Light.Yellow;

export const DEFAULT_SHAPE_STROKE_COLOR = StrokeColor.Yellow;

export const DEFAULT_SHAPE_TEXT_COLOR = StrokeColor.Black;
