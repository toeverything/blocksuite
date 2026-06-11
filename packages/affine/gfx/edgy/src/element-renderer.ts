import {
  type ElementRenderer,
  ElementRendererExtension,
} from '@labre/affine-block-surface';
import type { EdgyFacetsElementModel } from '@labre/affine-model';

import {
  COLORS,
  FONT_FAMILY,
  LABEL_FONT_SIZE,
  PICTO_STROKE,
  REF_H,
  REF_W,
  refScale,
  VENN,
} from './consts';
import { CIRCLE_A, CIRCLE_B, CIRCLE_C, facetLabelAnchors } from './label-layout';

type Pt = { x: number; y: number };

/**
 * Canvas renderer for the EDGY Enterprise Design Facets diagram — reproduces the
 * validated mockup: three overlapping circles (Identity / Architecture /
 * Experience), the three pairwise intersection regions (Organisation / Brand /
 * Product) painted by clip-intersection, the white centre, the six white
 * pictograms and the three facet labels placed outside the circles.
 *
 * The whole diagram is drawn in the fixed reference space and scaled uniformly
 * to the element bounds so the circles never distort.
 */
export const edgy: ElementRenderer<EdgyFacetsElementModel> = (
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

  // Uniform fit of the reference design, centered (letterboxed).
  const { s, ox, oy } = refScale(w, h);
  ctx.translate(ox, oy);
  ctx.scale(s, s);

  const A = CIRCLE_A;
  const B = CIRCLE_B;
  const C = CIRCLE_C;
  const R = VENN.R;

  const disc = (c: Pt, color: string) => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  // Paint the region common to every circle in `cs` (clip-intersection).
  const inter = (cs: Pt[], color: string) => {
    ctx.save();
    for (const c of cs) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, REF_W, REF_H);
    ctx.restore();
  };

  // ── Facets + intersections ──────────────────────────────────────────
  disc(A, COLORS.identity);
  disc(B, COLORS.architecture);
  disc(C, COLORS.experience);
  inter([A, B], COLORS.organisation);
  inter([A, C], COLORS.brand);
  inter([B, C], COLORS.product);
  inter([A, B, C], COLORS.center);

  // White separating outlines.
  ctx.strokeStyle = COLORS.separator;
  ctx.lineWidth = 2.5;
  for (const c of [A, B, C]) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ── White pictos ────────────────────────────────────────────────────
  const pictoSetup = () => {
    ctx.strokeStyle = COLORS.picto;
    ctx.fillStyle = COLORS.picto;
    ctx.lineWidth = PICTO_STROKE;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  };
  const lens = (x: number, y: number) => {
    pictoSetup();
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 7, y + 7);
    ctx.lineTo(x + 15, y + 15);
    ctx.stroke();
  };
  const house = (x: number, y: number) => {
    pictoSetup();
    ctx.beginPath();
    ctx.moveTo(x - 11, y + 9);
    ctx.lineTo(x - 11, y - 2);
    ctx.lineTo(x, y - 11);
    ctx.lineTo(x + 11, y - 2);
    ctx.lineTo(x + 11, y + 9);
    ctx.closePath();
    ctx.stroke();
  };
  const heart = (x: number, y: number) => {
    pictoSetup();
    ctx.beginPath();
    ctx.moveTo(x, y + 11);
    ctx.bezierCurveTo(x - 14, y - 1, x - 9, y - 12, x, y - 4);
    ctx.bezierCurveTo(x + 9, y - 12, x + 14, y - 1, x, y + 11);
    ctx.closePath();
    ctx.stroke();
  };
  const network = (x: number, y: number) => {
    pictoSetup();
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x - 9, y + 7);
    ctx.lineTo(x + 9, y + 7);
    ctx.closePath();
    ctx.stroke();
    for (const [px, py] of [
      [x, y - 9],
      [x - 9, y + 7],
      [x + 9, y + 7],
    ]) {
      ctx.beginPath();
      ctx.arc(px, py, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  const sun = (x: number, y: number) => {
    pictoSetup();
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9);
      ctx.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12);
      ctx.stroke();
    }
  };
  const cube = (x: number, y: number) => {
    pictoSetup();
    const p = [
      [x, y - 11],
      [x + 10, y - 5],
      [x + 10, y + 6],
      [x, y + 12],
      [x - 10, y + 6],
      [x - 10, y - 5],
    ];
    ctx.beginPath();
    p.forEach(([qx, qy], i) => (i ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy)));
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 5);
    ctx.lineTo(x, y + 1);
    ctx.lineTo(x + 10, y - 5);
    ctx.moveTo(x, y + 1);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
  };

  // Single-facet zone pictos.
  lens(A.x - 30, A.y - 22);
  house(B.x + 30, B.y - 22);
  heart(C.x, C.y + 36);
  // Intersection pictos at the validated sweet spots.
  network(VENN.cx, 114);
  sun(VENN.cx - 58, 206);
  cube(VENN.cx + 58, 206);

  // ── Labels (outside the circles) ────────────────────────────────────
  if (model.showLabels) {
    ctx.font = `500 ${LABEL_FONT_SIZE}px ${FONT_FAMILY}`;
    ctx.textBaseline = 'middle';
    const colorByField: Record<string, string> = {
      identityLabel: COLORS.identity,
      architectureLabel: COLORS.architecture,
      experienceLabel: COLORS.experience,
    };
    for (const { field, text, x, y, align } of facetLabelAnchors(model)) {
      ctx.fillStyle = colorByField[field];
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
    }
  }
};

export const EdgyFacetsRendererExtension = ElementRendererExtension('edgy', edgy);
