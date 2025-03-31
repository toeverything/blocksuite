import {
  DefaultTheme,
  type HighlighterElementModel,
} from '@blocksuite/affine-model';

import type { CanvasRenderer } from '../../canvas-renderer.js';

export function highlighter(
  model: HighlighterElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: CanvasRenderer
) {
  const {
    rotate,
    deserializedXYWH: [, , w, h],
  } = model;
  const cx = w / 2;
  const cy = h / 2;

  ctx.setTransform(
    matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
  );

  const color = renderer.getColorValue(
    model.color,
    DefaultTheme.hightlighterColor,
    true
  );

  ctx.fillStyle = color;

  ctx.fill(new Path2D(model.commands));
}
