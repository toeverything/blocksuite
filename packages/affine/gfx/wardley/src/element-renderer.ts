import {
  type ElementRenderer,
  ElementRendererExtension,
} from '@blocksuite/affine-block-surface';
import type { WardleyBackgroundElementModel } from '@blocksuite/affine-model';

import {
  ARROW,
  AXIS_LABELS,
  CARD_RADIUS,
  COLORS,
  EVOLUTION_BOUNDARIES,
  EVOLUTION_PHASES,
  FONT_FAMILY,
  FONTS,
  LINE,
  MARGIN,
  OFFSETS,
} from './consts';

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
  ctx.strokeStyle = COLORS.divider;
  ctx.lineWidth = LINE.divider;
  ctx.setLineDash([5, 5]);
  for (const r of EVOLUTION_BOUNDARIES) {
    line(ex(r), py0, ex(r), py1);
  }
  ctx.setLineDash([]);

  // ── Axes (L shape) + arrowheads ─────────────────────────────────────
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = LINE.axis;
  // Stop each axis line at the base of its arrowhead (with a 1px overlap, hidden
  // under the triangle) so the line thickness never pokes past the tip on zoom.
  line(px0, py1, px1 - ARROW + 1, py1); // X axis (arrow tip at px1)
  line(px0, py1, px0, py0 + ARROW - 1); // Y axis (arrow tip at py0)
  ctx.fillStyle = COLORS.axis;
  // X arrow (points right)
  ctx.beginPath();
  ctx.moveTo(px1, py1);
  ctx.lineTo(px1 - ARROW, py1 - ARROW / 2);
  ctx.lineTo(px1 - ARROW, py1 + ARROW / 2);
  ctx.closePath();
  ctx.fill();
  // Y arrow (points up)
  ctx.beginPath();
  ctx.moveTo(px0, py0);
  ctx.lineTo(px0 - ARROW / 2, py0 + ARROW);
  ctx.lineTo(px0 + ARROW / 2, py0 + ARROW);
  ctx.closePath();
  ctx.fill();

  // ── Horizontal labels ───────────────────────────────────────────────
  ctx.textBaseline = 'alphabetic';
  // Phase labels (left-aligned at each zone start)
  ctx.font = `${FONTS.phase}px ${FONT_FAMILY}`;
  ctx.fillStyle = COLORS.label;
  ctx.textAlign = 'left';
  for (const [label, start] of EVOLUTION_PHASES) {
    ctx.fillText(label, ex(start) + OFFSETS.phasePad, py1 + OFFSETS.phaseBaseline);
  }
  // "Evolution" near the X arrow (right-aligned, same baseline)
  ctx.font = `${FONTS.axis}px ${FONT_FAMILY}`;
  ctx.fillStyle = COLORS.axis;
  ctx.textAlign = 'right';
  ctx.fillText(
    AXIS_LABELS.xAxis,
    px1 - OFFSETS.evolutionPadRight,
    py1 + OFFSETS.phaseBaseline
  );
  // Direction indicators (top corners, inside the plot)
  ctx.font = `${FONTS.direction}px ${FONT_FAMILY}`;
  ctx.fillStyle = COLORS.label;
  ctx.textAlign = 'left';
  ctx.fillText(
    AXIS_LABELS.evolutionStart,
    px0 + OFFSETS.directionPadLeft,
    py0 + OFFSETS.directionTop
  );
  ctx.textAlign = 'right';
  ctx.fillText(
    AXIS_LABELS.evolutionEnd,
    px1 - OFFSETS.directionPadRight,
    py0 + OFFSETS.directionTop
  );

  // ── Rotated Y labels (hugging the axis, symmetric with the X labels) ─
  vtext(AXIS_LABELS.yAxis, px0 - OFFSETS.yHug, (py0 + py1) / 2, FONTS.axis, COLORS.axis);
  vtext(
    AXIS_LABELS.visibilityHigh,
    px0 - OFFSETS.yHug,
    py0 + OFFSETS.visibleTop,
    FONTS.visibility,
    COLORS.label
  );
  vtext(
    AXIS_LABELS.visibilityLow,
    px0 - OFFSETS.yHug,
    py1 - OFFSETS.invisibleBottom,
    FONTS.visibility,
    COLORS.label
  );
};

export const WardleyElementRendererExtension = ElementRendererExtension(
  'wardley',
  wardley
);
