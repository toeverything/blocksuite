import type { Rgb } from './types.js';

export const AREA_CIRCLE_R = 12.5;
export const SLIDER_CIRCLE_R = 10.5;

// [Rgb, stop][]
export const COLORS: [Rgb, number][] = [
  [{ r: 1, g: 0, b: 0 }, 0 / 6],
  [{ r: 1, g: 1, b: 0 }, 1 / 6],
  [{ r: 0, g: 1, b: 0 }, 2 / 6],
  [{ r: 0, g: 1, b: 1 }, 3 / 6],
  [{ r: 0, g: 0, b: 1 }, 4 / 6],
  [{ r: 1, g: 0, b: 1 }, 5 / 6],
  [{ r: 1, g: 0, b: 0 }, 1],
];

export const FIRST_COLOR = COLORS[0][0];

export const MATCHERS = {
  hex3: /^#?([0-9a-fA-F]{3})$/,
  hex6: /^#?([0-9a-fA-F]{6})$/,
  hex4: /^#?([0-9a-fA-F]{4})$/,
  hex8: /^#?([0-9a-fA-F]{8})$/,
  other: /[^0-9a-fA-F]/,
};
