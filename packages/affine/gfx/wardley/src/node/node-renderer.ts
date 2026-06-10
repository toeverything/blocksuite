import {
  type ElementRenderer,
  ElementRendererExtension,
} from '@blocksuite/affine-block-surface';
import { shape as shapeRenderer } from '@blocksuite/affine-gfx-shape';
import { type WardleyNodeElementModel, DefaultTheme } from '@blocksuite/affine-model';

import { ANCHOR, ECOSYSTEM, METHOD, NODE_FILL } from './consts';

/**
 * Renderer for a Wardley node. The circle is drawn by REUSING the native shape
 * renderer (so stroke width, colors and theme behave exactly like a native
 * ellipse). On top of it, a glyph is drawn for two kinds:
 *  - `anchor`    → an inscribed person (head + shoulders), clipped to the circle.
 *  - `ecosystem` → a double border at the rim + diagonal hatching confined to the
 *                  inner donut + a hollow central circle.
 * All glyph strokes use the model's (editable) stroke color; the white band and
 * the hollow center come from the base fill, so colors stay editable.
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
  // matrix, so the glyph can be drawn in the same space afterwards.
  const glyphMatrix = DOMMatrix.fromMatrix(matrix)
    .translateSelf(cx, cy)
    .rotateSelf(model.rotate)
    .translateSelf(-cx, -cy);

  // Native ellipse (fill / stroke / theme handled natively).
  shapeRenderer(model, ctx, matrix, renderer, rc, bound);

  if (
    model.kind !== 'anchor' &&
    model.kind !== 'ecosystem' &&
    model.kind !== 'method'
  )
    return;

  const strokeWidth = model.strokeWidth || 1;
  const R = Math.min(w, h) / 2 - strokeWidth / 2;
  const color = renderer.getColorValue(
    model.strokeColor,
    DefaultTheme.shapeStrokeColor,
    true
  );

  ctx.setTransform(glyphMatrix);

  // ── Anchor: person glyph (clipped to the circle) ────────────────────
  if (model.kind === 'anchor') {
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
    return;
  }

  // ── Method: a white component inscribed in the colored outer circle ──
  if (model.kind === 'method') {
    const rInner = R * METHOD.centerRatio;
    ctx.fillStyle = NODE_FILL;
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    return;
  }

  // ── Ecosystem: double border + hatched inner donut + hollow center ──
  const rBorder2 = R * ECOSYSTEM.secondBorderRatio;
  const rCenter = R * ECOSYSTEM.centerRatio;
  const rHatch = R * ECOSYSTEM.hatchOuterRatio;

  // Hatch confined to the donut [rCenter, rHatch] (even-odd clip = annulus).
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rHatch, 0, Math.PI * 2);
  ctx.moveTo(cx + rCenter, cy);
  ctx.arc(cx, cy, rCenter, 0, Math.PI * 2);
  ctx.clip('evenodd');

  ctx.lineWidth = Math.max(0.5, strokeWidth * 0.6);
  ctx.strokeStyle = color;
  const step = R * ECOSYSTEM.hatchSpacingRatio;
  for (let d = -2 * R; d <= 2 * R; d += step) {
    ctx.beginPath();
    ctx.moveTo(cx - R, cy - R + d);
    ctx.lineTo(cx + R, cy + R + d);
    ctx.stroke();
  }
  ctx.restore();

  // Double border (2nd inscribed circle) + central hole border. No fill: the
  // white band and hollow center come from the base ellipse fill.
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, rBorder2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, rCenter, 0, Math.PI * 2);
  ctx.stroke();
};

export const WardleyNodeRendererExtension = ElementRendererExtension(
  'wardleyNode',
  wardleyNode
);
