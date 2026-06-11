import {
  type ElementRenderer,
  ElementRendererExtension,
} from '@labre/affine-block-surface';
import type { WardleyBackgroundElementModel } from '@labre/affine-model';

import {
  ARROW,
  CARD_RADIUS,
  COLORS,
  EVOLUTION_BOUNDARIES,
  FONT_FAMILY,
  FONTS,
  LINE,
  MARGIN,
  OFFSETS,
} from './consts';
import { BENEFIT_ZERO_FRAC, paintGradientBackground } from './gradient';

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/**
 * Canvas renderer for the Wardley map background — reproduces mockup C:
 * an L-shaped axes frame (no top/right border), dashed evolution dividers and
 * the symmetric axis labels.
 *
 * All sizes (fonts, margins, offsets, strokes) are FIXED model units — they do
 * not scale with the element size. Only the plot interior scales.
 */
export const wardley: ElementRenderer<WardleyBackgroundElementModel> = (
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

  const px0 = MARGIN.left;
  const px1 = w - MARGIN.right;
  const py0 = MARGIN.top;
  const py1 = h - MARGIN.bottom;
  const pw = px1 - px0;
  const ph = py1 - py0;
  const ex = (r: number) => px0 + r * pw;

  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  const vtext = (
    text: string,
    x: number,
    y: number,
    fontSize: number,
    color: string
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.font = `${fontSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };

  // ── Card (element bounds) ───────────────────────────────────────────
  const inset = LINE.card / 2;
  roundRectPath(ctx, inset, inset, w - inset * 2, h - inset * 2, CARD_RADIUS);
  ctx.fillStyle = COLORS.card;
  ctx.fill();
  ctx.strokeStyle = COLORS.cardBorder;
  ctx.lineWidth = LINE.card;
  ctx.stroke();

  // ── Curve-driven gradient variants (inscribed in the frame) ─────────
  // Hidden when `showGradient` is false → plain white background.
  if (model.variant !== 'classic' && model.showGradient) {
    paintGradientBackground(ctx, model.variant, px0, px1, py0, py1);
    if (model.variant === 'benefit') {
      const zy = py1 - BENEFIT_ZERO_FRAC * ph;
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px0, zy);
      ctx.lineTo(px1, zy);
      ctx.stroke();
    }
  }

  // ── Optional evolution band tints ───────────────────────────────────
  if (model.banded) {
    const starts = [0, 0.175, 0.4, 0.7];
    const ends = [0.175, 0.4, 0.7, 1];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = COLORS.band[i];
      ctx.fillRect(ex(starts[i]), py0, ex(ends[i]) - ex(starts[i]), ph);
    }
  }

  // ── Evolution phase dividers (dashed) ───────────────────────────────
  if (model.showColumnDividers) {
    ctx.strokeStyle = COLORS.divider;
    ctx.lineWidth = LINE.divider;
    ctx.setLineDash([5, 5]);
    for (const r of EVOLUTION_BOUNDARIES) {
      line(ex(r), py0, ex(r), py1);
    }
    ctx.setLineDash([]);
  }

  // ── Axes (L shape) + arrowheads ─────────────────────────────────────
  // X and Y axes are independently toggleable. Each line stops at the base of
  // its arrowhead (1px overlap, hidden under the triangle) so the line never
  // pokes past the tip on zoom.
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = LINE.axis;
  ctx.fillStyle = COLORS.axis;
  if (model.showXAxis) {
    line(px0, py1, px1 - ARROW + 1, py1); // X axis (arrow tip at px1)
    ctx.beginPath(); // X arrow (points right)
    ctx.moveTo(px1, py1);
    ctx.lineTo(px1 - ARROW, py1 - ARROW / 2);
    ctx.lineTo(px1 - ARROW, py1 + ARROW / 2);
    ctx.closePath();
    ctx.fill();
  }
  if (model.showYAxis) {
    line(px0, py1, px0, py0 + ARROW - 1); // Y axis (arrow tip at py0)
    ctx.beginPath(); // Y arrow (points up)
    ctx.moveTo(px0, py0);
    ctx.lineTo(px0 - ARROW / 2, py0 + ARROW);
    ctx.lineTo(px0 + ARROW / 2, py0 + ARROW);
    ctx.closePath();
    ctx.fill();
  }

  // ── Horizontal labels ───────────────────────────────────────────────
  ctx.textBaseline = 'alphabetic';
  // Phase (column) labels (left-aligned at each zone start)
  if (model.showColumnLabels) {
    ctx.font = `${FONTS.phase}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.label;
    ctx.textAlign = 'left';
    const phases: Array<[string, number]> = [
      [model.phase0, 0],
      [model.phase1, 0.175],
      [model.phase2, 0.4],
      [model.phase3, 0.7],
    ];
    for (const [label, start] of phases) {
      ctx.fillText(
        label,
        ex(start) + OFFSETS.phasePad,
        py1 + OFFSETS.phaseBaseline
      );
    }
  }
  // "Evolution" title near the X arrow (tied to the X axis)
  if (model.showXAxis) {
    ctx.font = `${FONTS.axis}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.axis;
    ctx.textAlign = 'right';
    ctx.fillText(
      model.xAxisTitle,
      px1 - OFFSETS.evolutionPadRight,
      py1 + OFFSETS.phaseBaseline
    );
  }
  // Direction indicators (Uncharted / Industrialized, top corners)
  if (model.showCornerLabels) {
    ctx.font = `${FONTS.direction}px ${FONT_FAMILY}`;
    ctx.fillStyle = COLORS.label;
    ctx.textAlign = 'left';
    ctx.fillText(
      model.evolutionStart,
      px0 + OFFSETS.directionPadLeft,
      py0 + OFFSETS.directionTop
    );
    ctx.textAlign = 'right';
    ctx.fillText(
      model.evolutionEnd,
      px1 - OFFSETS.directionPadRight,
      py0 + OFFSETS.directionTop
    );
  }

  // ── Rotated Y labels (hugging the axis, symmetric with the X labels) ─
  if (model.showYAxis) {
    vtext(
      model.yAxisTitle,
      px0 - OFFSETS.yHug,
      (py0 + py1) / 2,
      FONTS.axis,
      COLORS.axis
    );
  }
  if (model.showVisibilityLabels) {
    vtext(
      model.visibilityHigh,
      px0 - OFFSETS.yHug,
      py0 + OFFSETS.visibleTop,
      FONTS.visibility,
      COLORS.label
    );
    vtext(
      model.visibilityLow,
      px0 - OFFSETS.yHug,
      py1 - OFFSETS.invisibleBottom,
      FONTS.visibility,
      COLORS.label
    );
  }
};

export const WardleyElementRendererExtension = ElementRendererExtension(
  'wardley',
  wardley
);
