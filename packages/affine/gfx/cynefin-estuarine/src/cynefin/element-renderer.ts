import {
  type ElementRenderer,
  ElementRendererExtension,
} from '@labre/affine-block-surface';
import type { CynefinElementModel } from '@labre/affine-model';

import { FONT_FAMILY, refScale } from '../utils';
import {
  BOUNDARY_PATHS,
  COLORS,
  CONFUSION,
  CONFUSION_DESC,
  DASH_RECTS,
  DESCRIPTIONS,
  HATCHES,
  NAMES,
  REF_H,
  REF_W,
} from './consts';

/**
 * Canvas renderer for the Liminal Cynefin diagram — reproduces the official SVG
 * (boundary strokes via Path2D, hatched cliff, dashed Complicated↔Clear paving)
 * plus the domain names and (hideable) descriptor texts. Drawn in the fixed
 * reference space and scaled uniformly to the element bounds.
 */
export const cynefin: ElementRenderer<CynefinElementModel> = (
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

  const { s, ox, oy } = refScale(w, h, REF_W, REF_H);
  ctx.translate(ox, oy);
  ctx.scale(s, s);

  // ── Boundary strokes ────────────────────────────────────────────────
  ctx.strokeStyle = COLORS.boundary;
  ctx.fillStyle = COLORS.boundary;
  ctx.lineCap = 'butt';
  for (const [d, lw, miter] of BOUNDARY_PATHS) {
    ctx.lineJoin = miter ? 'miter' : 'round';
    ctx.lineWidth = lw;
    ctx.stroke(new Path2D(d));
  }
  ctx.lineJoin = 'round';

  // ── Cliff hatching ──────────────────────────────────────────────────
  ctx.lineWidth = 3;
  for (const [x1, y1, x2, y2] of HATCHES) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // ── Dashed boundary (oriented square pavings) ───────────────────────
  for (const [x, y, sz, rot] of DASH_RECTS) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
    ctx.restore();
  }

  // ── Domain names + "Confusion" title ────────────────────────────────
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  if (model.showLabels) {
    ctx.fillStyle = COLORS.name;
    ctx.font = `700 34px ${FONT_FAMILY}`;
    for (const [t, x, y] of NAMES) ctx.fillText(t, x, y);
    ctx.font = `700 25px ${FONT_FAMILY}`;
    ctx.fillText(CONFUSION.title, CONFUSION.x, CONFUSION.y);
  }

  // ── Descriptor texts (hideable) ─────────────────────────────────────
  if (model.showDescriptions) {
    ctx.fillStyle = COLORS.text;
    ctx.font = `14px ${FONT_FAMILY}`;
    const block = (x: number, y: number, lines: string[]) =>
      lines.forEach((t, i) => ctx.fillText(t, x, y + i * 19));
    for (const { x, y, lines } of DESCRIPTIONS) block(x, y, lines);
    block(CONFUSION_DESC.x, CONFUSION_DESC.y, CONFUSION_DESC.lines);
  }
};

export const CynefinRendererExtension = ElementRendererExtension(
  'cynefin',
  cynefin
);
