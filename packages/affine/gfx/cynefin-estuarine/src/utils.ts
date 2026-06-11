/**
 * Uniform fit of a fixed reference design (`refW × refH`) into an element of
 * size `w × h`: the scale factor plus the centering offsets (letterboxed).
 * Keeps the artwork undistorted at any element size.
 */
export function refScale(w: number, h: number, refW: number, refH: number) {
  const s = Math.min(w / refW, h / refH);
  return { s, ox: (w - refW * s) / 2, oy: (h - refH * s) / 2 };
}

export const FONT_FAMILY = 'Inter, sans-serif';
