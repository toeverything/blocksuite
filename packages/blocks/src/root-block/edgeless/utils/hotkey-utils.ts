import type { ShapeTool } from '../../../_common/types.js';
import { ShapeType } from '../../../surface-block/index.js';
import type { EdgelessRootBlockComponent } from '../edgeless-root-block.js';

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
  shapeType: ShapeTool['shapeType'],
  edgeless: EdgelessRootBlockComponent
) {
  const props =
    shapeType === 'roundedRect'
      ? {
          shapeType: ShapeType.Rect,
          radius: 0.1,
        }
      : {
          shapeType,
          radius: 0,
        };

  edgeless.service.editSession.record('shape', props);
}
