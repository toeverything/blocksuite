import type { WardleyBackgroundElementModel } from '@labre/affine-model';

import { FONTS, MARGIN, OFFSETS } from './consts';

/** The editable label fields of a Wardley background. */
export type WardleyLabelField =
  | 'xAxisTitle'
  | 'yAxisTitle'
  | 'evolutionStart'
  | 'evolutionEnd'
  | 'visibilityHigh'
  | 'visibilityLow'
  | 'phase0'
  | 'phase1'
  | 'phase2'
  | 'phase3';

/** A label's hit box in element-local coordinates (axis-aligned, padded). */
export interface WardleyLabelHit {
  field: WardleyLabelField;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Rough per-character advance — only used to size generous hit boxes. */
const approxTextWidth = (text: string, fontSize: number) =>
  Math.max(fontSize, text.length * fontSize * 0.6);

/**
 * Compute the clickable boxes of every *visible* Wardley label, in the
 * element's local space. Positions are derived from the SAME constants the
 * renderer uses (`MARGIN` / `OFFSETS` / `FONTS`), so the hit boxes track the
 * drawn text. Boxes are padded so double-clicking is forgiving.
 */
export function getWardleyLabelHits(
  model: WardleyBackgroundElementModel,
  w: number,
  h: number
): WardleyLabelHit[] {
  const px0 = MARGIN.left;
  const px1 = w - MARGIN.right;
  const py0 = MARGIN.top;
  const py1 = h - MARGIN.bottom;
  const ex = (r: number) => px0 + r * (px1 - px0);

  const pad = 6;
  const hits: WardleyLabelHit[] = [];

  // Horizontal label anchored on its text baseline.
  const addH = (
    field: WardleyLabelField,
    text: string,
    fontSize: number,
    ax: number,
    baseline: number,
    align: 'left' | 'right'
  ) => {
    const tw = approxTextWidth(text, fontSize);
    const minX = align === 'right' ? ax - tw : ax;
    const maxX = align === 'right' ? ax : ax + tw;
    hits.push({
      field,
      minX: minX - pad,
      maxX: maxX + pad,
      minY: baseline - fontSize - pad,
      maxY: baseline + fontSize * 0.3 + pad,
    });
  };

  // Vertical label (drawn rotated -90°), centered on (ax, ay).
  const addV = (
    field: WardleyLabelField,
    text: string,
    fontSize: number,
    ax: number,
    ay: number
  ) => {
    const tw = approxTextWidth(text, fontSize);
    hits.push({
      field,
      minX: ax - fontSize - pad,
      maxX: ax + fontSize * 0.4 + pad,
      minY: ay - tw / 2 - pad,
      maxY: ay + tw / 2 + pad,
    });
  };

  if (model.showColumnLabels) {
    addH('phase0', model.phase0, FONTS.phase, ex(0) + OFFSETS.phasePad, py1 + OFFSETS.phaseBaseline, 'left');
    addH('phase1', model.phase1, FONTS.phase, ex(0.175) + OFFSETS.phasePad, py1 + OFFSETS.phaseBaseline, 'left');
    addH('phase2', model.phase2, FONTS.phase, ex(0.4) + OFFSETS.phasePad, py1 + OFFSETS.phaseBaseline, 'left');
    addH('phase3', model.phase3, FONTS.phase, ex(0.7) + OFFSETS.phasePad, py1 + OFFSETS.phaseBaseline, 'left');
  }
  if (model.showXAxis) {
    addH('xAxisTitle', model.xAxisTitle, FONTS.axis, px1 - OFFSETS.evolutionPadRight, py1 + OFFSETS.phaseBaseline, 'right');
  }
  if (model.showCornerLabels) {
    addH('evolutionStart', model.evolutionStart, FONTS.direction, px0 + OFFSETS.directionPadLeft, py0 + OFFSETS.directionTop, 'left');
    addH('evolutionEnd', model.evolutionEnd, FONTS.direction, px1 - OFFSETS.directionPadRight, py0 + OFFSETS.directionTop, 'right');
  }
  if (model.showYAxis) {
    addV('yAxisTitle', model.yAxisTitle, FONTS.axis, px0 - OFFSETS.yHug, (py0 + py1) / 2);
  }
  if (model.showVisibilityLabels) {
    addV('visibilityHigh', model.visibilityHigh, FONTS.visibility, px0 - OFFSETS.yHug, py0 + OFFSETS.visibleTop);
    addV('visibilityLow', model.visibilityLow, FONTS.visibility, px0 - OFFSETS.yHug, py1 - OFFSETS.invisibleBottom);
  }

  return hits;
}

/** First label whose (padded) box contains the local point, or null. */
export function hitTestWardleyLabel(
  hits: WardleyLabelHit[],
  lx: number,
  ly: number
): WardleyLabelHit | null {
  for (const hit of hits) {
    if (lx >= hit.minX && lx <= hit.maxX && ly >= hit.minY && ly <= hit.maxY) {
      return hit;
    }
  }
  return null;
}
