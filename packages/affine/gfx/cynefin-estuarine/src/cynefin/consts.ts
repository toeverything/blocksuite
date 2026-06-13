/**
 * Visual constants for the Liminal Cynefin diagram, reproduced from the official
 * SVG (viewBox 0 0 1080 777). All geometry is authored in that fixed reference
 * space and scaled uniformly to the element bounds by the renderer.
 */

export const REF_W = 1080;
export const REF_H = 777;

export const COLORS = {
  boundary: '#333333',
  teal: '#2a9d99',
  /** Domain headings + subheadings (h1 / h2). */
  heading: '#6d6e71',
  /** Body, small annotations and the big A / C glyphs. */
  body: '#231f20',
} as const;

/**
 * Dark boundary strokes drawn *behind* the teal "iterate" curve:
 * [svg path, lineWidth, miterJoin].
 */
export const DARK_BACK_PATHS: ReadonlyArray<readonly [string, number, boolean]> = [
  // Main arc: top segment (Complex|Complicated) then left segment (Complex|Chaotic)
  ['M 550.1 17 A 296 296 0 0 1 338 328.5 A 448.7 448.7 0 0 1 26 331', 15.5, false],
  // Thin "Confusion" arc sweeping down towards the cliff
  ['M 649 294 C 644 382, 588 462, 440 506', 5, false],
];

/** Teal "iterate" curve, drawn *over* the back arcs and the dashed paving. */
export const TEAL_PATH =
  'M 475.1 9.1 C 477.5 13.3, 484.4 26.1, 489.3 34.6 C 494.2 43.1, 499.7 51.7, 504.4 60.2 C 509.1 68.7, 513.4 77.2, 517.6 85.7 C 521.8 94.2, 525.7 102.7, 529.7 111.2 C 533.7 119.7, 538.1 128.3, 541.8 136.8 C 545.5 145.3, 549.0 153.8, 551.9 162.3 C 554.8 170.8, 557.1 179.3, 559.0 187.8 C 560.9 196.3, 562.0 204.8, 563.0 213.3 C 564.0 221.8, 564.8 230.4, 565.0 238.9 C 565.2 247.4, 565.0 255.9, 564.0 264.4 C 563.0 272.9, 561.2 281.4, 559.0 289.9 C 556.8 298.4, 554.6 307.0, 550.9 315.5 C 547.2 324.0, 542.3 332.5, 536.8 341.0 C 531.2 349.5, 524.9 358.3, 517.6 366.5 C 510.4 374.7, 501.6 383.0, 493.3 390.0 C 485.0 397.0, 476.4 403.1, 468.0 408.4 C 459.6 413.7, 451.2 418.0, 442.8 421.7 C 434.4 425.4, 425.9 427.4, 417.5 430.8 C 409.1 434.2, 400.3 437.5, 392.2 442.1 C 384.1 446.7, 377.1 455.5, 369.0 458.4 C 360.9 461.3, 352.1 459.4, 343.7 459.4 C 335.3 459.4, 326.9 459.1, 318.5 458.4 C 310.1 457.7, 301.6 456.8, 293.2 455.4 C 284.8 454.0, 276.4 452.2, 268.0 450.3 C 259.6 448.4, 251.1 446.2, 242.7 444.1 C 234.3 442.1, 225.8 440.0, 217.4 438.0 C 209.0 436.0, 200.6 434.4, 192.2 431.9 C 183.8 429.3, 175.3 426.1, 166.9 422.7 C 158.5 419.3, 150.0 415.5, 141.6 411.4 C 133.2 407.3, 124.8 403.3, 116.4 398.2 C 108.0 393.1, 99.5 386.9, 91.1 380.8 C 82.7 374.7, 74.3 368.7, 65.9 361.4 C 57.5 354.1, 45.7 342.8, 40.6 336.9 C 35.5 330.9, 36.4 327.6, 35.5 325.7';
export const TEAL_WIDTH = 10.5;

/**
 * Dark boundary strokes drawn *over* the teal curve:
 * [svg path, lineWidth, miterJoin].
 */
export const DARK_FRONT_PATHS: ReadonlyArray<readonly [string, number, boolean]> = [
  // Thick descending branch with the bottom elbow (right edge of the cliff)
  ['M 340 332 C 390 440, 437 525, 472 632 Q 479 658, 453 700', 15.5, true],
  // Thin left line (left edge of the cliff)
  ['M 345 356 C 372 440, 408 540, 413 655 C 414 685, 412 710, 412 738', 4, false],
];

/** Cliff hatching: [x1,y1,x2,y2], lineWidth 3. */
export const HATCHES: ReadonlyArray<readonly [number, number, number, number]> = [
  [375, 420, 371, 431],
  [386, 443, 380, 461],
  [395, 462, 386, 483],
  [402, 477, 392, 506],
  [412, 497, 400, 539],
  [417, 511, 403, 558],
  [427, 533, 409, 591],
  [435, 551, 411, 612],
  [444, 573, 415, 659],
  [455, 603, 415, 700],
];

/** Dashed Complicated↔Clear boundary, as oriented square pavings: [x,y,size,rotateDeg]. */
export const DASH_RECTS: ReadonlyArray<readonly [number, number, number, number]> = [
  [511, 245, 13.8, 206.8], [530, 255.5, 13.7, 205.2], [549.5, 265.5, 13.6, 203.5],
  [569.5, 274.5, 13.5, 201.9], [590, 282.5, 13.5, 200.2], [610.5, 289.5, 13.4, 198.6],
  [631, 296, 13.3, 196.9], [673.5, 307, 13.2, 193.6], [695, 311.5, 13.1, 192.0],
  [716, 315.5, 13.0, 190.3], [738, 319, 12.9, 188.7], [759.5, 322, 12.8, 187.0],
  [781, 324.5, 12.8, 185.4], [803, 325.5, 12.7, 183.7], [824.5, 326.5, 12.6, 182.1],
  [846, 327.5, 12.5, 180.5], [868, 327.5, 12.4, 178.8], [889.5, 326.5, 12.3, 177.2],
  [912, 325.5, 12.2, 175.5], [933, 323.5, 12.1, 173.9], [954.5, 321.5, 12.1, 172.2],
  [976, 318, 12.0, 170.6], [998, 314, 11.9, 168.9], [1019, 310, 11.8, 167.3],
];

/**
 * The four domain blocks. Each has a heading (h1) and, when descriptions are
 * shown, a subheading (h2) and three decision lines whose lead word is bold.
 * All three text levels share the block's left `x`.
 */
export interface DomainBlock {
  heading: string;
  /** Left edge shared by heading, subheading and body lines. */
  x: number;
  /** Heading (h1) baseline. */
  hy: number;
  subheading: string;
  /** Subheading (h2) baseline. */
  sy: number;
  /** Decision lines: bold lead word + remainder, with their baseline. */
  lines: ReadonlyArray<{ lead: string; rest: string; y: number }>;
}

export const DOMAINS: ReadonlyArray<DomainBlock> = [
  {
    heading: 'Complex',
    x: 37,
    hy: 31,
    subheading: 'Adaptive system',
    sy: 53,
    lines: [
      { lead: 'Probe', rest: ' the context with parallel experiments', y: 71 },
      { lead: 'Sense', rest: ' how the context reacts', y: 90 },
      { lead: 'Respond', rest: ' by amplifying positive experiments', y: 109 },
    ],
  },
  {
    heading: 'Complicated',
    x: 779,
    hy: 31,
    subheading: 'Ordered system',
    sy: 53,
    lines: [
      { lead: 'Sense', rest: ' the context with analytical methods', y: 71 },
      { lead: 'Analyse', rest: ' observations', y: 90 },
      { lead: 'Respond', rest: ' by applying one of many good solutions', y: 109 },
    ],
  },
  {
    heading: 'Chaotic',
    x: 37,
    hy: 587,
    subheading: 'Un-ordered system',
    sy: 609,
    lines: [
      { lead: 'Act', rest: ' on the context to stabilize (it or yourself)', y: 627 },
      { lead: 'Sense', rest: ' how the context reacts', y: 646 },
      { lead: 'Respond', rest: ' by re-acting', y: 665 },
    ],
  },
  {
    heading: 'Clear',
    x: 779,
    hy: 587,
    subheading: 'Ordered system',
    sy: 609,
    lines: [
      { lead: 'Sense', rest: ' the context with analytical methods', y: 627 },
      { lead: 'Categorize', rest: ' observations', y: 646 },
      { lead: 'Respond', rest: ' by applying tried and true practices', y: 665 },
    ],
  },
];

/** Teal annotation labels (centered): [text, x, y]. */
export const TEAL_LABELS: ReadonlyArray<readonly [string, number, number]> = [
  ['iterate', 510, 16],
  ['iterate', 533, 230],
  ['strategy by design', 257, 225],
  ['radical innovation', 268, 390],
  ['by design', 268, 406],
  ['extreme repurposing', 217, 496],
  ['good practice', 814, 196],
  ['best practice', 751, 459],
];

/** Small exaptation sub-labels (centered): [text, x, y]. */
export const SMALL_LABELS: ReadonlyArray<readonly [string, number, number]> = [
  ['dispositional exaptation', 257, 239],
  ['stimulated exaptation', 268, 419],
  ['stress-based exaptation', 217, 510],
];

/**
 * The two central markers — Aporia (A) and Confusion (C) — each a big glyph and
 * a name, with an optional teal note ("prepare to exit"). All centered.
 */
export interface Marker {
  letter: string;
  /** Big glyph position. */
  lx: number;
  ly: number;
  name: string;
  /** Name (body) position. */
  nx: number;
  ny: number;
  /** Optional teal note position + text. */
  note?: { text: string; x: number; y: number };
}

export const MARKERS: ReadonlyArray<Marker> = [
  {
    letter: 'A',
    lx: 444,
    ly: 334,
    name: 'Aporia',
    nx: 447,
    ny: 349,
    note: { text: 'prepare to exit', x: 449, y: 366 },
  },
  { letter: 'C', lx: 531, ly: 419, name: 'Confusion', nx: 529, ny: 436 },
];
