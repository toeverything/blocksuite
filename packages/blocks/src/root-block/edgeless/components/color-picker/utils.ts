// https://www.w3.org/TR/css-color-4/

import type { ColorScheme } from '../../../../_common/theme/theme-observer.js';
import type { Color } from '../../../../surface-block/consts.js';
import type {
  Hsv,
  Hsva,
  ModeType,
  PickColorType,
  Point,
  Rgb,
  Rgba,
} from './types.js';

import { COLORS, FIRST_COLOR } from './consts.js';

export const defaultPoint = (x = 0, y = 0): Point => ({ x, y });

export const defaultHsva = (): Hsva => ({ ...rgbToHsv(FIRST_COLOR), a: 1 });

export function linearGradientAt(t: number): Rgb {
  if (t < 0) return COLORS[0][0];
  if (t > 1) return COLORS[COLORS.length - 1][0];

  let low = 0;
  let high = COLORS.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const color = COLORS[mid];
    if (color[1] < t) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  if (low === 0) {
    low = 1;
  }

  const [rgb0, s0] = COLORS[low - 1];
  const [rgb1, s1] = COLORS[low];
  t = (t - s0) / (s1 - s0);

  const [r, g, b] = [
    lerp(rgb0.r, rgb1.r, t),
    lerp(rgb0.g, rgb1.g, t),
    lerp(rgb0.b, rgb1.b, t),
  ];

  return { r, g, b };
}

const lerp = (a: number, b: number, t: number) => a + t * (b - a);

export const clamp = (min: number, val: number, max: number) =>
  Math.min(Math.max(min, val), max);

export const bound01 = (n: number, max: number) => {
  n = clamp(0, n, max);

  // Handle floating point rounding errors
  if (Math.abs(n - max) < 0.000001) {
    return 1;
  }

  // Convert into [0, 1] range if it isn't already
  return (n % max) / max;
};

// Converts an RGB color value to HSV
export const rgbToHsv = ({ r, g, b }: Rgb): Hsv => {
  const v = Math.max(r, g, b); // value
  const d = v - Math.min(r, g, b);

  if (d === 0) {
    return { h: 0, s: 0, v };
  }

  const s = d / v;
  let h = 0;

  if (v === r) {
    h = (g - b) / d + (g < b ? 6 : 0);
  } else if (v === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }

  h /= 6;

  return { h, s, v };
};

// Converts an HSV color value to RGB
export const hsvToRgb = ({ h, s, v }: Hsv): Rgb => {
  if (h < 0) h = (h + 1) % 1; // wrap
  h *= 6;
  s = clamp(0, s, 1);

  const i = Math.floor(h),
    f = h - i,
    p = v * (1 - s),
    q = v * (1 - f * s),
    t = v * (1 - (1 - f) * s),
    m = i % 6;

  let rgb = [0, 0, 0];

  if (m === 0) rgb = [v, t, p];
  else if (m === 1) rgb = [q, v, p];
  else if (m === 2) rgb = [p, v, t];
  else if (m === 3) rgb = [p, q, v];
  else if (m === 4) rgb = [t, p, v];
  else if (m === 5) rgb = [v, p, q];

  const [r, g, b] = rgb;

  return { r, g, b };
};

// Converts a RGBA color value to HSVA
export const rgbaToHsva = (rgba: Rgba): Hsva => ({
  ...rgbToHsv(rgba),
  a: rgba.a,
});

// Converts an HSVA color value to RGBA
export const hsvaToRgba = (hsva: Hsva): Rgba => ({
  ...hsvToRgb(hsva),
  a: hsva.a,
});

// Converts an RGB color to hex
export const rgbToHex = ({ r, g, b }: Rgb) =>
  [r, g, b]
    .map(n => n * 255)
    .map(Math.round)
    .map(s => s.toString(16).padStart(2, '0'))
    .join('');

// Converts an RGBA color to CSS's hex8 string
export const rgbaToHex8 = ({ r, g, b, a }: Rgba) => {
  const hex = [r, g, b, a]
    .map(n => n * 255)
    .map(Math.round)
    .map(n => n.toString(16).padStart(2, '0'))
    .join('');
  return `#${hex}`;
};

// Converts an HSV color to CSS's `rgba`
export const hsvToHex8 = (color: Hsv, a = 1) =>
  rgbaToHex8({ ...hsvToRgb(color), a });

// Parses an hex string to RGBA.
export const parseHexToRgba = (hex: string) => {
  if (hex.startsWith('#')) {
    hex = hex.substring(1);
  }

  const len = hex.length;
  let arr: string[] = [];

  if (len === 3 || len === 4) {
    arr = hex.split('').map(s => s.repeat(2));
  } else if (len === 6 || len === 8) {
    arr = Array.from<number>({ length: len / 2 })
      .fill(0)
      .map((n, i) => n + i * 2)
      .map(n => hex.substring(n, n + 2));
  }

  const [r, g, b, a = 1] = arr
    .map(s => parseInt(s, 16))
    .map(n => bound01(n, 255));

  return { r, g, b, a };
};

// Parses an hex string to HSVA
export const parseHexToHsva = (hex: string) => rgbaToHsva(parseHexToRgba(hex));

// Compares two hsvs.
export const eq = (lhs: Hsv, rhs: Hsv) =>
  lhs.h === rhs.h && lhs.s === rhs.s && lhs.v === rhs.v;

export const renderCanvas = (canvas: HTMLCanvasElement, rgb: Rgb) => {
  const { width, height } = canvas;
  const ctx = canvas.getContext('2d')!;

  ctx.globalCompositeOperation = 'color';
  ctx.clearRect(0, 0, width, height);

  // Saturation: from top to bottom
  const s = ctx.createLinearGradient(0, 0, 0, height);
  s.addColorStop(0, '#0000'); // transparent
  s.addColorStop(1, '#000'); // black

  ctx.fillStyle = s;
  ctx.fillRect(0, 0, width, height);

  // Value: from left to right
  const v = ctx.createLinearGradient(0, 0, width, 0);
  v.addColorStop(0, '#fff'); // white
  v.addColorStop(1, `#${rgbToHex(rgb)}`); // picked color

  ctx.fillStyle = v;
  ctx.fillRect(0, 0, width, height);
};

// Drops alpha value
export const keepColor = (color: string) =>
  color.length > 7 ? color.substring(0, 7) : color;

export const parseStringToRgba = (value: string) => {
  if (value.startsWith('#')) {
    return parseHexToRgba(value);
  }

  if (value.startsWith('rgb')) {
    const [r, g, b, a = 1] = value
      .replace(/^rgba?/, '')
      .replace(/\(|\)/, '')
      .split(',')
      .map(s => parseFloat(s.trim()))
      // In CSS, the alpha in the range [0, 1]
      .map((n, i) => bound01(n, i === 3 ? 1 : 255));

    return { r, g, b, a };
  }

  return { r: 0, g: 0, b: 0, a: 1 };
};

// Preprocess Color
export const preprocessColor = (style: CSSStyleDeclaration) => {
  return ({ type, value }: { type: ModeType; value: string }) => {
    if (value.startsWith('--')) {
      value = style.getPropertyValue(value);
    }

    const rgba = parseStringToRgba(value);

    return { type, rgba };
  };
};

/**
 * Packs to generate a color object with picking type and an old color
 *
 * @param type - The pick color event type
 * @param key - The field name in the model
 * @param value - The color value
 * @param oldColor
 * @returns object
 *
 * @example
 * ```json
 * { 'fillColor': '#fff' }
 * { 'fillColor': { normal: '#fff' }}
 * { 'fillColor': { light: '#fff', 'dark': '#00f' }}
 * ```
 */
export const packColor = (
  type: PickColorType,
  key: string,
  value: string,
  oldColor?: Color
) => {
  if (type === 'palette') {
    return { [key]: value };
  }

  let color = { [type]: value };

  if (type !== 'normal') {
    if (typeof oldColor === 'object') {
      delete oldColor.normal;
      color = { ...oldColor, ...color };
    }

    // makes sure light/dark exist at the same time
    if (Object.keys(color).length === 1) {
      color[type === 'light' ? 'dark' : 'light'] = value;
    }
  }

  return { [key]: color };
};

/**
 * Packs to generate a color array with the color-scheme
 *
 * @param colorScheme - The current color theme
 * @param value - The color value
 * @param oldColor - The old color
 * @returns A color array
 */
export const packColorsWithColorScheme = (
  colorScheme: ColorScheme,
  value: string,
  oldColor: Color
) => {
  const colors: { type: ModeType; value: string }[] = [
    { type: 'normal', value },
    { type: 'light', value },
    { type: 'dark', value },
  ];
  let type: PickColorType = 'palette';

  if (typeof oldColor === 'object') {
    type = colorScheme in oldColor ? colorScheme : 'normal';
    colors[0].value = oldColor.normal ?? value;
    colors[1].value = oldColor.light ?? value;
    colors[2].value = oldColor.dark ?? value;
  }

  return { type, colors };
};
