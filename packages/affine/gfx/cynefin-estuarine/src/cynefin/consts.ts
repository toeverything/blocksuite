/**
 * Visual constants for the Liminal Cynefin diagram, reproduced from the official
 * SVG (viewBox 0 0 1080 777). All geometry is authored in that fixed reference
 * space and scaled uniformly to the element bounds by the renderer.
 */

export const REF_W = 1080;
export const REF_H = 777;

export const COLORS = {
  boundary: '#333333',
  name: '#4a4f54',
  text: '#6c7278',
} as const;

/** Core dark boundary strokes: [svg path, lineWidth, miterJoin]. */
export const BOUNDARY_PATHS: ReadonlyArray<readonly [string, number, boolean]> = [
  // Main arc: top segment (Complex|Complicated) then left segment (Complex|Chaotic)
  ['M 550.1 17 A 296 296 0 0 1 338 328.5 A 448.7 448.7 0 0 1 26 331', 15.5, false],
  // Thick descending branch with the bottom elbow (right edge of the cliff)
  ['M 340 332 C 390 440, 437 525, 472 632 Q 479 658, 453 700', 15.5, true],
  // Thin left line (left edge of the cliff)
  ['M 345 356 C 372 440, 408 540, 413 655 C 414 685, 412 710, 412 738', 4, false],
  // "Confusion" arc — extended to reach the cliff
  ['M 649 294 C 644 382, 585 466, 435 522', 5, false],
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

/** Domain name labels: [text, x, y]. */
export const NAMES: ReadonlyArray<readonly [string, number, number]> = [
  ['Complex', 32, 52],
  ['Complicated', 770, 52],
  ['Chaotic', 32, 694],
  ['Clear', 770, 694],
];

export const CONFUSION = { title: 'Confusion', x: 430, y: 402 } as const;

/** Descriptor text blocks (hideable): [x, y, lines...]. */
export const DESCRIPTIONS: ReadonlyArray<{ x: number; y: number; lines: string[] }> = [
  { x: 32, y: 74, lines: ['Adaptive system', 'Cause and effect do not exist', 'Events are dispositional', 'Constraints are enabling'] },
  { x: 770, y: 74, lines: ['Ordered system', 'Cause and effect exist but only experts see it', 'Events are predictable', 'Constraints are governing'] },
  { x: 32, y: 716, lines: ['Un-ordered system', 'Cause and effect do not exist', 'Events are unpredictable', 'Constraints do not exist'] },
  { x: 770, y: 716, lines: ['Ordered system', 'Cause and effect exist and is visible', 'Events are predictable', 'Constraints are fixed and rigid'] },
];

export const CONFUSION_DESC = { x: 430, y: 424, lines: ['The state of not knowing', 'in what domain we are'] };
