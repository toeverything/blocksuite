import {
  type ElementRenderer,
  ElementRendererExtension,
} from '@labre/affine-block-surface';
import type { BpmnPoolElementModel } from '@labre/affine-model';

import {
  POOL_BAND_FILL,
  POOL_BAND_WIDTH,
  POOL_FONT_FAMILY,
  POOL_FRAME_COLOR,
  POOL_FRAME_WIDTH,
  POOL_NAME_COLOR,
  POOL_NAME_FONT_SIZE,
} from './consts';

/** Trace a rounded-rectangle path (no dependency on ctx.roundRect). */
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

/**
 * Canvas renderer for a BPMN pool: a rounded-rect frame with a vertical name
 * band on the left (the participant name is drawn rotated, as in the spec).
 * Drawn directly in element space; the band width and font are fixed so they
 * stay legible at any pool size. Mirrors the other framework backgrounds.
 */
export const bpmnPool: ElementRenderer<BpmnPoolElementModel> = (
  model,
  ctx,
  matrix
) => {
  const [, , w, h] = model.deserializedXYWH;
  const cx = w / 2;
  const cy = h / 2;
  ctx.setTransform(
    matrix.translateSelf(cx, cy).rotateSelf(model.rotate).translateSelf(-cx, -cy)
  );

  const band = Math.min(POOL_BAND_WIDTH, w);
  const inset = POOL_FRAME_WIDTH / 2;

  // Name band (left), filled.
  ctx.fillStyle = POOL_BAND_FILL;
  ctx.fillRect(0, 0, band, h);

  // Frame + band divider.
  ctx.strokeStyle = POOL_FRAME_COLOR;
  ctx.lineWidth = POOL_FRAME_WIDTH;
  ctx.lineJoin = 'round';
  roundedRectPath(ctx, inset, inset, w - POOL_FRAME_WIDTH, h - POOL_FRAME_WIDTH, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(band, 0);
  ctx.lineTo(band, h);
  ctx.stroke();

  // Participant name, rotated to read up the band (skip when empty / too narrow).
  if (model.name && band > 12) {
    ctx.save();
    ctx.translate(band / 2, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = POOL_NAME_COLOR;
    ctx.font = `600 ${POOL_NAME_FONT_SIZE}px ${POOL_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(model.name, 0, 0);
    ctx.restore();
  }
};

export const BpmnPoolRendererExtension = ElementRendererExtension(
  'bpmnPool',
  bpmnPool
);
