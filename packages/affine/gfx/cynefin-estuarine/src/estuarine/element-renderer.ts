import {
  type ElementRenderer,
  ElementRendererExtension,
} from '@labre/affine-block-surface';
import type { EstuarineElementModel } from '@labre/affine-model';

import { FONT_FAMILY, refScale } from '../utils';
import {
  ARROWHEADS,
  AXIS_LABELS,
  AXIS_WIDTH,
  COLORS,
  COUNTERFACTUAL_PATH,
  COUNTERFACTUAL_WIDTH,
  E_AXIS,
  LABEL_LETTER_SPACING,
  LABELS,
  LIMINAL_PATH,
  LIMINAL_WIDTH,
  REF_H,
  REF_W,
  T_AXIS,
  VOLATILE_PATH,
  VOLATILE_WIDTH,
} from './consts';

/**
 * Canvas renderer for the Estuarine framework map — reproduces the official SVG:
 * the e (vertical, double-headed) / t (horizontal, single-headed) axes and the
 * three reference curves (Liminal / Volatile / Counter-factual), each with its
 * legend and individually hideable. Drawn in the fixed reference space and
 * scaled uniformly to the element bounds.
 */
export const estuarine: ElementRenderer<EstuarineElementModel> = (
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

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // ── Axes ────────────────────────────────────────────────────────────
  ctx.strokeStyle = COLORS.axis;
  ctx.fillStyle = COLORS.axis;
  ctx.lineWidth = AXIS_WIDTH;
  ctx.beginPath();
  ctx.moveTo(E_AXIS.x, E_AXIS.y1);
  ctx.lineTo(E_AXIS.x, E_AXIS.y2);
  ctx.moveTo(T_AXIS.x1, T_AXIS.y);
  ctx.lineTo(T_AXIS.x2, T_AXIS.y);
  ctx.stroke();
  for (const [[tx, ty], [ax, ay], [bx, by]] of ARROWHEADS) {
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.closePath();
    ctx.fill();
  }

  // Uppercase legend (centre-anchored, alphabetic baseline, letter-spaced).
  const hasSpacing = 'letterSpacing' in ctx;
  const legend = (l: { text: string; x: number; y: number; size: number; color: string }) => {
    ctx.fillStyle = l.color;
    ctx.font = `600 ${l.size}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    if (hasSpacing) ctx.letterSpacing = `${LABEL_LETTER_SPACING}px`;
    ctx.fillText(l.text, l.x, l.y);
    if (hasSpacing) ctx.letterSpacing = '0px';
  };

  // ── Liminal (green) ─────────────────────────────────────────────────
  if (model.showLiminal) {
    ctx.strokeStyle = COLORS.liminal;
    ctx.lineWidth = LIMINAL_WIDTH;
    ctx.stroke(new Path2D(LIMINAL_PATH));
    legend(LABELS.liminal);
  }

  // ── Volatile (red) ──────────────────────────────────────────────────
  if (model.showVolatile) {
    ctx.strokeStyle = COLORS.volatile;
    ctx.lineWidth = VOLATILE_WIDTH;
    ctx.stroke(new Path2D(VOLATILE_PATH));
    legend(LABELS.volatile);
  }

  // ── Counter-factual (dark) ──────────────────────────────────────────
  if (model.showCounterfactual) {
    ctx.strokeStyle = COLORS.counterfactual;
    ctx.lineWidth = COUNTERFACTUAL_WIDTH;
    ctx.stroke(new Path2D(COUNTERFACTUAL_PATH));
    legend(LABELS.counterfactual);
  }

  // ── Italic e / t axis letters ───────────────────────────────────────
  if (model.showAxisLabels) {
    ctx.fillStyle = COLORS.axisLabel;
    ctx.font = `italic 700 ${AXIS_LABELS.size}px Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(AXIS_LABELS.e.text, AXIS_LABELS.e.x, AXIS_LABELS.e.y);
    ctx.fillText(AXIS_LABELS.t.text, AXIS_LABELS.t.x, AXIS_LABELS.t.y);
  }
};

export const EstuarineRendererExtension = ElementRendererExtension(
  'estuarine',
  estuarine
);
