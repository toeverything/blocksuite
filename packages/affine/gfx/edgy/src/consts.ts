/**
 * Visual constants for the EDGY "Enterprise Design Facets" diagram.
 *
 * The whole diagram is authored in a FIXED reference coordinate space
 * (`REF_W × REF_H`, matching the validated mockup) and the renderer scales it
 * uniformly to the element bounds — so the three circles always stay circular
 * and the pictos/labels keep their relative proportions at any size.
 */

/** Reference design size (the validated mockup canvas). */
export const REF_W = 680;
export const REF_H = 400;

/** Circle geometry in reference coords. */
export const VENN = {
  cx: REF_W / 2,
  cy: 176,
  /** Circle radius. */
  R: 95,
  /** Distance of each circle centre from the diagram centre. */
  r0: 56,
} as const;

/** Saturated facet + intersection colours (faithful to the official icons). */
export const COLORS = {
  identity: '#00ea4e',
  architecture: '#034cee',
  experience: '#ff0056',
  organisation: '#00caf4',
  brand: '#ffa500',
  product: '#cf00ff',
  center: '#ffffff',
  separator: '#ffffff',
  picto: '#ffffff',
} as const;

/** Fixed picto line width + label font. */
export const PICTO_STROKE = 2.4;
export const LABEL_FONT_SIZE = 15;
export const FONT_FAMILY = 'Inter, sans-serif';

/**
 * Uniform fit of the reference design into an element of size `w × h`: the
 * scale factor plus the centering offsets (letterboxed). Shared by the renderer
 * (to draw) and the view (to map clicks back into reference coords).
 */
export function refScale(w: number, h: number) {
  const s = Math.min(w / REF_W, h / REF_H);
  return { s, ox: (w - REF_W * s) / 2, oy: (h - REF_H * s) / 2 };
}
