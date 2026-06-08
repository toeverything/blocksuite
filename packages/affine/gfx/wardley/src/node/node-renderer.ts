import {
  type ElementRenderer,
  ElementRendererExtension,
} from '@blocksuite/affine-block-surface';
import { shape as shapeRenderer } from '@blocksuite/affine-gfx-shape';
import { type WardleyNodeElementModel, DefaultTheme } from '@blocksuite/affine-model';

import { ANCHOR } from './consts';

/**
 * Renderer for a Wardley node. The circle is drawn by REUSING the native shape
 * renderer (so stroke width, colors and theme behave exactly like a native
 * ellipse). For `kind === 'anchor'` an inscribed person glyph is drawn on top.
 */
export const wardleyNode: ElementRenderer<WardleyNodeElementModel> = (
  model,
  ctx,
  matrix,
  renderer,
  rc,
  bound
) => {
  const [, , w, h] = model.deserializedXYWH;
  const cx = w / 2;
  const cy = h / 2;

  // Capture the element-local transform BEFORE the shape renderer mutates the
  // matrix, so the person glyph can be drawn in the same space afterwards.
  const personMatrix = DOMMatrix.fromMatrix(matrix)
    .translateSelf(cx, cy)
    .rotateSelf(model.rotate)
    .translateSelf(-cx, -cy);

  // Native ellipse (fill / stroke / theme handled natively).
  shapeRenderer(model, ctx, matrix, renderer, rc, bound);

  if (model.kind !== 'anchor') return;

  // ── Person glyph (clipped to the circle) ────────────────────────────
  const strokeWidth = model.strokeWidth || 1;
  const R = Math.min(w, h) / 2 - strokeWidth / 2;
  const color = renderer.getColorValue(
    model.strokeColor,
    DefaultTheme.shapeStrokeColor,
    true
  );

  ctx.setTransform(personMatrix);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R - strokeWidth / 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // head
  ctx.beginPath();
  ctx.arc(cx, cy + ANCHOR.headCY * R, ANCHOR.headR * R, 0, Math.PI * 2);
  ctx.stroke();

  // rounded shoulders (extremities sit on the circle border)
  const sx = ANCHOR.shoulderEndX * R;
  const sy = ANCHOR.shoulderEndY * R;
  const kx = ANCHOR.shoulderCtrlX * R;
  const ky = ANCHOR.shoulderCtrlY * R;
  ctx.beginPath();
  ctx.moveTo(cx - sx, cy + sy);
  ctx.bezierCurveTo(cx - kx, cy + ky, cx + kx, cy + ky, cx + sx, cy + sy);
  ctx.stroke();

  ctx.restore();
};

export const WardleyNodeRendererExtension = ElementRendererExtension(
  'wardleyNode',
  wardleyNode
);
