import type { EdgyFacetsElementModel } from '@labre/affine-model';

import { LABEL_FONT_SIZE, VENN } from './consts';

/** The three circle centres in reference coords. */
export const CIRCLE_A = { x: VENN.cx - 0.866 * VENN.r0, y: VENN.cy - 0.5 * VENN.r0 }; // Identity
export const CIRCLE_B = { x: VENN.cx + 0.866 * VENN.r0, y: VENN.cy - 0.5 * VENN.r0 }; // Architecture
export const CIRCLE_C = { x: VENN.cx, y: VENN.cy + VENN.r0 }; // Experience

/** The editable label fields of the facets diagram. */
export type EdgyLabelField =
  | 'identityLabel'
  | 'architectureLabel'
  | 'experienceLabel';

export interface EdgyLabelAnchor {
  field: EdgyLabelField;
  text: string;
  x: number;
  y: number;
  align: 'start' | 'end' | 'center';
}

/**
 * The three facet name anchors in reference coords, positioned fully outside
 * their circle (validated mockup). Shared by the renderer (to draw them) and
 * the label-layout hit testing (to edit them).
 */
export function facetLabelAnchors(
  model: EdgyFacetsElementModel
): EdgyLabelAnchor[] {
  return [
    {
      field: 'identityLabel',
      text: model.identityLabel,
      x: CIRCLE_A.x - VENN.R - 10,
      y: CIRCLE_A.y - 28,
      align: 'end',
    },
    {
      field: 'architectureLabel',
      text: model.architectureLabel,
      x: CIRCLE_B.x + VENN.R + 10,
      y: CIRCLE_B.y - 28,
      align: 'start',
    },
    {
      field: 'experienceLabel',
      text: model.experienceLabel,
      x: CIRCLE_C.x,
      y: CIRCLE_C.y + VENN.R + 22,
      align: 'center',
    },
  ];
}

/** A label's hit box in reference coords (axis-aligned, padded). */
export interface EdgyLabelHit {
  field: EdgyLabelField;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const approxTextWidth = (text: string, fontSize: number) =>
  Math.max(fontSize, text.length * fontSize * 0.6);

/**
 * Clickable boxes of every facet label, in reference coords. Derived from the
 * SAME anchors the renderer uses so they track the drawn text. Boxes are padded
 * so double-clicking is forgiving. Hidden when `showLabels` is false.
 */
export function getEdgyLabelHits(model: EdgyFacetsElementModel): EdgyLabelHit[] {
  if (!model.showLabels) return [];

  const pad = 6;
  const fs = LABEL_FONT_SIZE;
  return facetLabelAnchors(model).map(({ field, text, x, y, align }) => {
    const tw = approxTextWidth(text, fs);
    const minX = align === 'end' ? x - tw : align === 'center' ? x - tw / 2 : x;
    const maxX = align === 'end' ? x : align === 'center' ? x + tw / 2 : x + tw;
    return {
      field,
      minX: minX - pad,
      maxX: maxX + pad,
      minY: y - fs / 2 - pad,
      maxY: y + fs / 2 + pad,
    };
  });
}

/** First label whose (padded) box contains the reference-space point, or null. */
export function hitTestEdgyLabel(
  hits: EdgyLabelHit[],
  rx: number,
  ry: number
): EdgyLabelHit | null {
  for (const hit of hits) {
    if (rx >= hit.minX && rx <= hit.maxX && ry >= hit.minY && ry <= hit.maxY) {
      return hit;
    }
  }
  return null;
}
