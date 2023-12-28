import { ShapeType } from '../consts.js';
import type { ShapeMethods } from '../types.js';
import { DiamondMethods } from './diamond.js';
import { EllipseMethods } from './ellipse.js';
import { RectMethods } from './rect.js';
import { TriangleMethods } from './triangle.js';

const { Rect, Triangle, Ellipse, Diamond } = ShapeType;

export const ShapeMethodsMap: Record<ShapeType, ShapeMethods> = {
  [Rect]: RectMethods,
  [Triangle]: TriangleMethods,
  [Ellipse]: EllipseMethods,
  [Diamond]: DiamondMethods,
};
