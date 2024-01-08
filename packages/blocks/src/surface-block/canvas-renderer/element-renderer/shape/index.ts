import type {
  ShapeElementModel,
  ShapeType,
} from '../../../element-model/shape.js';
import type { Renderer } from '../../renderer.js';
import { diamond } from './diamond.js';
import { ellipse } from './ellipse.js';
import { rect } from './rect.js';
import { triangle } from './triangle.js';

const shapeRenderers: {
  [key in ShapeType]: (
    model: ShapeElementModel,
    ctx: CanvasRenderingContext2D,
    matrix: DOMMatrix,
    renderer: Renderer
  ) => void;
} = {
  diamond,
  rect,
  triangle,
  ellipse,
};

export function shape(
  model: ShapeElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) {
  shapeRenderers[model.shapeType](model, ctx, matrix, renderer);
}
