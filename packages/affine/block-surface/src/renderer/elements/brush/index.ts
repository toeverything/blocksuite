import { type BrushElementModel, DefaultTheme } from '@blocksuite/affine-model';

import type { CanvasRenderer } from '../../canvas-renderer.js';

export function brush(
  model: BrushElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: CanvasRenderer
) {
  const { rotate } = model;
  const [, , w, h] = model.deserializedXYWH;
  const cx = w / 2;
  const cy = h / 2;

  ctx.setTransform(
    matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
  );

  const color = renderer.getColorValue(model.color, DefaultTheme.black, true);

  ctx.fillStyle = color;

  ctx.fill(new Path2D(model.commands));
}
