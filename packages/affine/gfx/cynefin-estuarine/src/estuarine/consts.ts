/**
 * Visual constants for the Estuarine framework map, reproduced from the official
 * SVG (viewBox 0 0 690 801). All geometry is authored in that fixed reference
 * space and scaled uniformly to the element bounds by the renderer. The e axis
 * is vertical & double-headed (energy), the t axis horizontal & single-headed
 * (time only flows one way).
 */

export const REF_W = 690;
export const REF_H = 801;

export const COLORS = {
  axis: '#941253',
  /** Italic e / t axis letters. */
  axisLabel: '#c0392b',
  liminal: '#5ecc44',
  /** LIMINAL legend (darker than the curve). */
  liminalLabel: '#2e7d32',
  volatile: '#e63322',
  counterfactual: '#1a1a1a',
  /** VOLATILE + COUNTER FACTUAL legends. */
  label: '#1a1a1a',
} as const;

/** e axis (vertical, double-headed): x, top y, bottom y. */
export const E_AXIS = { x: 43.5, y1: 97, y2: 763 } as const;
/** t axis (horizontal, single-headed → right): y, left x, right x. */
export const T_AXIS = { y: 649, x1: 28, x2: 616 } as const;
export const AXIS_WIDTH = 8;

/** Filled arrowhead triangles: [[tipX,tipY],[baseAX,baseAY],[baseBX,baseBY]]. */
export const ARROWHEADS: ReadonlyArray<
  readonly [readonly [number, number], readonly [number, number], readonly [number, number]]
> = [
  [[43.5, 72], [30, 100], [57, 100]], // e — top
  [[43.5, 785], [30, 758], [57, 758]], // e — bottom
  [[643, 649], [613, 636], [613, 662]], // t — right
];

/** Liminal: green boundary rising gently then dipping at the right end. */
export const LIMINAL_PATH =
  'M 63 193 C 67 192, 78 189, 85 188 C 92 187, 100 186, 107 185 C 114 184, 122 183, 129 183 C 136 183, 144 183, 151 183 C 158 183, 166 183, 173 183 C 180 183, 188 184, 195 185 C 202 186, 210 188, 217 189 C 224 190, 232 192, 239 194 C 246 196, 254 198, 261 201 C 268 204, 276 207, 283 210 C 290 213, 298 217, 305 220 C 312 223, 320 226, 327 230 C 334 234, 342 238, 349 242 C 356 246, 364 250, 371 255 C 378 260, 386 264, 393 269 C 400 274, 408 278, 415 283 C 422 288, 430 292, 437 297 C 444 302, 451 306, 458 310 C 465 314, 473 319, 480 323 C 487 327, 495 332, 502 335 C 509 338, 517 341, 524 343 C 531 345, 539 348, 546 349 C 553 350, 561 350, 568 350 C 575 350, 583 348, 590 346 C 597 344, 605 340, 612 336 C 619 332, 626 325, 633 319 C 640 313, 648 302, 651 298 C 654 294, 654 295, 654 294';
export const LIMINAL_WIDTH = 4.5;

/** Counter-factual: dark boundary sweeping from the top down to the right. */
export const COUNTERFACTUAL_PATH =
  'M 422 30 C 420 33, 414 41, 411 47 C 408 53, 405 59, 402 65 C 399 71, 397 77, 395 83 C 393 89, 392 95, 391 101 C 390 107, 389 113, 389 119 C 389 125, 389 131, 390 137 C 391 143, 392 149, 394 155 C 396 161, 399 167, 402 173 C 405 179, 408 185, 412 191 C 416 197, 421 203, 426 209 C 431 215, 436 221, 442 226 C 448 231, 454 237, 460 241 C 466 245, 472 249, 478 252 C 484 255, 490 258, 496 260 C 502 262, 508 264, 514 266 C 520 268, 526 270, 532 271 C 538 272, 544 274, 550 275 C 556 276, 562 277, 568 278 C 574 279, 580 279, 586 279 C 592 279, 598 280, 604 280 C 610 280, 616 281, 622 281 C 628 281, 634 280, 640 280 C 646 280, 655 279, 658 279';
export const COUNTERFACTUAL_WIDTH = 5.5;

/** Volatile: red boundary descending along the left, bulging right. */
export const VOLATILE_PATH =
  'M 58 446 C 61 447, 70 451, 76 454 C 82 457, 88 462, 94 466 C 100 470, 107 476, 112 481 C 117 486, 122 492, 126 498 C 130 504, 135 509, 139 515 C 143 521, 145 526, 148 532 C 151 538, 153 544, 155 550 C 157 556, 159 562, 160 568 C 161 574, 162 580, 163 586 C 164 592, 164 598, 164 604 C 164 610, 166 616, 166 622 C 166 628, 166 634, 165 640 C 164 646, 164 652, 163 658 C 162 664, 162 670, 161 676 C 160 682, 160 688, 159 694 C 158 700, 155 706, 154 712 C 153 718, 152 724, 151 730 C 150 736, 148 746, 147 749';
export const VOLATILE_WIDTH = 5;

/** Uppercase legends: anchored centre, alphabetic baseline, with letter-spacing. */
export const LABELS = {
  counterfactual: { text: 'COUNTER FACTUAL', x: 422, y: 25, size: 20, color: COLORS.label },
  liminal: { text: 'LIMINAL', x: 316, y: 192, size: 18, color: COLORS.liminalLabel },
  volatile: { text: 'VOLATILE', x: 219, y: 783, size: 20, color: COLORS.volatile },
} as const;

/** Italic Georgia axis letters (left-anchored, alphabetic baseline). */
export const AXIS_LABELS = {
  e: { text: 'e', x: 14, y: 138 },
  t: { text: 't', x: 580, y: 685 },
  size: 34,
} as const;

export const LABEL_LETTER_SPACING = 4;
