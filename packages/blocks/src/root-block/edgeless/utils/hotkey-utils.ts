import {
  ShapeType,
  getShapeRadius,
  getShapeType,
} from '@blocksuite/affine-model';

import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';
import type { ShapeTool } from '../tools/shape-tool.js';

const shapeMap: Record<ShapeTool['shapeType'], number> = {
  [ShapeType.Rect]: 0,
  [ShapeType.Ellipse]: 1,
  [ShapeType.Diamond]: 2,
  [ShapeType.Triangle]: 3,
  roundedRect: 4,
};
const shapes = Object.keys(shapeMap) as ShapeTool['shapeType'][];

export function getNextShapeType(cur: ShapeTool['shapeType']) {
  return shapes[(shapeMap[cur] + 1) % shapes.length];
}

export function updateShapeProps(
  shapeName: ShapeTool['shapeType'],
  edgeless: EdgelessRootBlockComponent
) {
  edgeless.service.editPropsStore.recordLastProps('shape', {
    shapeType: getShapeType(shapeName),
    radius: getShapeRadius(shapeName),
  });
}
