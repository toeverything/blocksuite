import {
  type ElementRenderer,
  ElementRendererExtension,
} from '@labre/affine-block-surface';
import { shape as shapeRenderer } from '@labre/affine-gfx-shape';
import { type BpmnNodeElementModel, DefaultTheme } from '@labre/affine-model';

/**
 * Renderer for a BPMN flow-object node. The shape body (ellipse / rounded rect
 * / diamond) is drawn by REUSING the native shape renderer — so stroke width,
 * colors, inner text and theme behave exactly like a native shape. Only
 * `gatewayExclusive` is decorated: an X drawn on top in the node's (editable)
 * stroke color. Events and task are plain native shapes.
 *
 * Mirrors the EDGY node renderer.
 */
export const bpmnNode: ElementRenderer<BpmnNodeElementModel> = (
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

  // Native shape (fill / stroke / inner text / theme handled natively).
  shapeRenderer(model, ctx, matrix, renderer, rc, bound);

  if (model.kind !== 'gatewayExclusive') return;

  const color = renderer.getColorValue(
    model.strokeColor,
    DefaultTheme.shapeStrokeColor,
    true
  );

  // ── Exclusive-gateway X, centred and sized to the diamond ───────────
  const r = Math.min(w, h) * 0.2;
  ctx.setTransform(glyphMatrix);
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r, -r);
  ctx.lineTo(r, r);
  ctx.moveTo(-r, r);
  ctx.lineTo(r, -r);
  ctx.stroke();
};

export const BpmnNodeRendererExtension = ElementRendererExtension(
  'bpmnNode',
  bpmnNode
);
