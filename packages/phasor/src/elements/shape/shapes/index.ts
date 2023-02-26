import type { ShapeMethods, ShapeType } from '../types.js';
import { DiamondMethods } from './diamond.js';
import { EllipseMethods } from './ellipse.js';
import { RectMethods } from './rect.js';
import { TriangleMethods } from './triangle.js';

export const ShapeMethodsMap: Record<ShapeType, ShapeMethods> = {
  rect: RectMethods,
  triangle: TriangleMethods,
  ellipse: EllipseMethods,
  diamond: DiamondMethods,
};
