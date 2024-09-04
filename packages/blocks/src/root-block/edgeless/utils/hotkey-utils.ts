import { ShapeType } from '@blocksuite/affine-model';

import type { ShapeTool } from '../tools/shape-tool.js';

const shapeMap: Record<ShapeTool['shapeName'], number> = {
  [ShapeType.Rect]: 0,
  [ShapeType.Ellipse]: 1,
  [ShapeType.Diamond]: 2,
  [ShapeType.Triangle]: 3,
  roundedRect: 4,
};
const shapes = Object.keys(shapeMap) as ShapeTool['shapeName'][];

export function getNextShapeType(cur: ShapeTool['shapeName']) {
  return shapes[(shapeMap[cur] + 1) % shapes.length];
}
