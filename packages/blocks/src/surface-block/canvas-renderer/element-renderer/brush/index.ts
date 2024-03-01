import type { BrushElementModel } from '../../../element-model/brush.js';
import type { Renderer } from '../../renderer.js';

export function brush(
  model: BrushElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) {
  const { color, rotate } = model;
  const [, , w, h] = model.deserializedXYWH;
  const cx = w / 2;
  const cy = h / 2;

  ctx.setTransform(
    matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
  );

  ctx.fillStyle = renderer.getVariableColor(color);
  ctx.fill(new Path2D(model.commands));
}
