import type { ShapeType } from '../../../consts/shape.js';
import { diamond } from './diamond.js';
import { ellipse } from './ellipse.js';
import { polygon } from './polygon.js';
import { rect } from './rect.js';
import { triangle } from './triangle.js';

export const shapeMethods: Record<ShapeType, typeof rect> = {
  rect,
  triangle,
  ellipse,
  diamond,
  polygon,
};
