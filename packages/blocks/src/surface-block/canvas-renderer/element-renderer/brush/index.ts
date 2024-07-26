import type { BrushElementModel } from '../../../element-model/brush.js';
import type { Renderer } from '../../renderer.js';

export function brush(
  model: BrushElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) {
  const { rotate } = model;
  const [, , w, h] = model.deserializedXYWH;
  const cx = w / 2;
  const cy = h / 2;

  ctx.setTransform(
    matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
  );

  const color = renderer.getColor(model.color, '#000000', true);

  ctx.fillStyle = color;

  ctx.fill(new Path2D(model.commands));
}
