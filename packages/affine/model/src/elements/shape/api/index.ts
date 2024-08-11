import type { ShapeType } from '../../../utils/index.js';

import { diamond } from './diamond.js';
import { ellipse } from './ellipse.js';
import { rect } from './rect.js';
import { triangle } from './triangle.js';

export const shapeMethods: {
  [key in ShapeType]: typeof rect;
} = {
  rect,
  triangle,
  ellipse,
  diamond,
};
