// https://www.w3.org/TR/css-color-4/
// MIT https://github.com/bgrins/TinyColor

export type Rgb = {
  // [0, 255]
  r: number;
  // [0, 255]
  g: number;
  // [0, 255]
  b: number;
};

export type Hsv = {
  // [0, 360]
  h: number;
  // [0, 100]
  s: number;
  // [0, 100]
  v: number;
};

// [Rgb, stop][]
export const COLORS: [Rgb, number][] = [
  [{ r: 255, g: 0, b: 0 }, 0],
  [{ r: 255, g: 255, b: 0 }, 1 / 6],
  [{ r: 0, g: 255, b: 0 }, 2 / 6],
  [{ r: 0, g: 255, b: 255 }, 3 / 6],
  [{ r: 0, g: 0, b: 255 }, 4 / 6],
  [{ r: 255, g: 0, b: 255 }, 5 / 6],
  [{ r: 255, g: 0, b: 0 }, 1],
];

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
    interpolate(rgb0.r, rgb1.r, t),
    interpolate(rgb0.g, rgb1.g, t),
    interpolate(rgb0.b, rgb1.b, t),
  ].map(Math.round);

  return { r, g, b };
}

const interpolate = (a: number, b: number, t: number) => a + t * (b - a);

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

export const bound = (n: number, max: number) => bound01(n, max) * 100;

// Converts an RGB color value to HSV
export const rgbToHsv = ({ r, g, b }: Rgb): Hsv => {
  r = bound01(r, 255);
  g = bound01(g, 255);
  b = bound01(b, 255);

  let v = Math.max(r, g, b);
  const d = v - Math.min(r, g, b);
  let s = v === 0 ? 0 : d / v;
  let h = 0;

  if (d === 0) {
    s *= 100;
    v *= 100;
    return { h, s, v };
  }

  if (v === r) {
    h = (g - b) / d + (g < b ? 6 : 0);
  } else if (v === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }

  h /= 6;

  h *= 360;
  s *= 100;
  v *= 100;

  return { h, s, v };
};

// Converts an HSV color value to RGB.
export const hsvToRgb = ({ h, s, v }: Hsv): Rgb => {
  h = bound01(h, 360) * 6;
  s = bound01(s, 100);
  v = bound01(v, 100);

  const i = Math.floor(h),
    f = h - i,
    p = v * (1 - s),
    q = v * (1 - f * s),
    t = v * (1 - (1 - f) * s),
    mod = i % 6;

  let r = [v, q, p, p, t, v][mod],
    g = [t, v, v, q, p, p][mod],
    b = [p, p, t, v, v, q][mod];

  r *= 255;
  g *= 255;
  b *= 255;

  return { r, g, b };
};

// Converts an RGB color to hex
export const rgbToHex = ({ r, g, b }: Rgb) =>
  [r, g, b].map(n => Math.round(n).toString(16).padStart(2, '0')).join('');

// Converts an HSV color to CSS's `hex8`.
export const rgbaToHex8 = ({ r, g, b }: Rgb, a = 1) =>
  [r, g, b, a * 255]
    .map(n => Math.round(n).toString(16).padStart(2, '0'))
    .join('');

// Converts an HSV color to CSS's `rgba`.
export const hsvToRgbaString = (color: Hsv, a = 1) => {
  const { r, g, b } = hsvToRgb(color);
  return `rgba(${r},${g},${b},${a})`;
};

export const AREA_CIRCLE_R = 12.5;
export const SLIDER_CIRCLE_R = 10.5;

export const LINEAR_GRADIENT = buildLinearGradient();

export const FIRST_COLOR = COLORS[0][0];

// Builds a linear gradient with the colors.
function buildLinearGradient() {
  const colors = COLORS.map(
    ([{ r, g, b }, stop]) => `rgb(${r},${g},${b}) ${stop * 100}%`
  );
  return `linear-gradient(to right, ${colors.join(',')})`;
}

export const MATCKERS = {
  hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
  hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
};
