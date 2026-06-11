import {
  type ElementRenderer,
  ElementRendererExtension,
} from '@blocksuite/affine-block-surface';
import type { EstuarineElementModel } from '@blocksuite/affine-model';

import { FONT_FAMILY, refScale } from '../utils';
import {
  COLORS,
  COUNTERFACTUAL_PATH,
  E_BOTTOM,
  E_TOP,
  LABELS,
  LIMINAL_PATH,
  Ox,
  Oy,
  REF_H,
  REF_W,
  T_RIGHT,
  VOLATILE,
} from './consts';

/**
 * Canvas renderer for the Estuarine framework map: the e (vertical, double-
 * headed) / t (horizontal, single-headed) axes and the three reference curves
 * (Liminal / Volatile / Counter-factual), each with its legend and individually
 * hideable. Drawn in the fixed reference space and scaled uniformly.
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

  const arrowHead = (x: number, y: number, a: number) => {
    const k = 13;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - k * Math.cos(a - 0.4), y - k * Math.sin(a - 0.4));
    ctx.lineTo(x - k * Math.cos(a + 0.4), y - k * Math.sin(a + 0.4));
    ctx.closePath();
    ctx.fill();
  };

  // ── Axes ────────────────────────────────────────────────────────────
  ctx.strokeStyle = COLORS.axis;
  ctx.fillStyle = COLORS.axis;
  ctx.lineWidth = 4;
  // e axis (vertical, double-headed)
  ctx.beginPath();
  ctx.moveTo(Ox, E_TOP);
  ctx.lineTo(Ox, E_BOTTOM);
  ctx.stroke();
  arrowHead(Ox, E_TOP, -Math.PI / 2);
  arrowHead(Ox, E_BOTTOM, Math.PI / 2);
  // t axis (horizontal, single-headed → right)
  ctx.beginPath();
  ctx.moveTo(Ox, Oy);
  ctx.lineTo(T_RIGHT, Oy);
  ctx.stroke();
  arrowHead(T_RIGHT, Oy, 0);

  if (model.showAxisLabels) {
    ctx.font = `italic 700 24px Georgia, serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(LABELS.e.text, LABELS.e.x, LABELS.e.y);
    ctx.fillText(LABELS.t.text, LABELS.t.x, LABELS.t.y);
  }

  const legend = (text: string, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.font = `600 16px ${FONT_FAMILY}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
  };

  // ── Volatile (right half-circle dipping below zero) ─────────────────
  if (model.showVolatile) {
    ctx.strokeStyle = COLORS.volatile;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(Ox, Oy, VOLATILE.r, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    legend(LABELS.volatile.text, LABELS.volatile.x, LABELS.volatile.y, COLORS.volatile);
  }

  // ── Liminal (green wave) ────────────────────────────────────────────
  if (model.showLiminal) {
    ctx.strokeStyle = COLORS.liminal;
    ctx.lineWidth = 4.5;
    ctx.stroke(new Path2D(LIMINAL_PATH));
    legend(LABELS.liminal.text, LABELS.liminal.x, LABELS.liminal.y, COLORS.liminal);
  }

  // ── Counter-factual (dark curve, top-right) ─────────────────────────
  if (model.showCounterfactual) {
    ctx.strokeStyle = COLORS.counterfactual;
    ctx.lineWidth = 3;
    ctx.stroke(new Path2D(COUNTERFACTUAL_PATH));
    legend(
      LABELS.counterfactual.text,
      LABELS.counterfactual.x,
      LABELS.counterfactual.y,
      COLORS.counterfactual
    );
  }
};

export const EstuarineRendererExtension = ElementRendererExtension(
  'estuarine',
  estuarine
);
