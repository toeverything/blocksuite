/**
 * Visual constants for the Estuarine framework map. Authored in a fixed
 * reference space (REF_W × REF_H) and scaled uniformly to the element bounds.
 * Origin O = (Ox, Oy): e axis is vertical & double-headed, t axis horizontal &
 * single-headed (time only flows one way).
 */

export const REF_W = 680;
export const REF_H = 640;

export const Ox = 84;
export const Oy = 470;
/** Axis extents. */
export const E_TOP = 42;
export const E_BOTTOM = REF_H - 26; // 614
export const T_RIGHT = REF_W - 34; // 646

export const COLORS = {
  axis: '#c81e6e',
  liminal: '#2fd11f',
  volatile: '#ee2a2a',
  counterfactual: '#222222',
} as const;

/** Liminal: long gentle wave that rises again at the right end. */
export const LIMINAL_PATH =
  'M 84 196 C 174 145, 294 168, 414 238 C 564 318, 704 352, 646 256';
/** Counter-factual: dark curve, top-right. */
export const COUNTERFACTUAL_PATH = 'M 334 80 C 444 92, 594 150, 632 250';
/** Volatile: right half-circle centred on O, both ends on the e axis (the lower one below zero). */
export const VOLATILE = { r: 150 } as const;

export const LABELS = {
  liminal: { text: 'LIMINAL', x: 334, y: 150 },
  volatile: { text: 'VOLATILE', x: 204, y: 610 },
  counterfactual: { text: 'COUNTER FACTUAL', x: 444, y: 52 },
  e: { text: 'e', x: 62, y: 74 },
  t: { text: 't', x: 654, y: 494 },
} as const;
