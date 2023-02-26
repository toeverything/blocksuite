import type { ShapeType, ShapeUtils } from '../types.js';
import { Diamond } from './diamond.js';
import { Ellipse } from './ellipse.js';
import { Rect } from './rect.js';
import { Triangle } from './triangle.js';

const shapeUtilsMap: Record<ShapeType, ShapeUtils> = {
  rect: Rect,
  triangle: Triangle,
  ellipse: Ellipse,
  diamond: Diamond,
};

export function getShapeUtils(shapeType: ShapeType): ShapeUtils {
  return shapeUtilsMap[shapeType];
}
