/**
 * Curve-driven gradient backgrounds (Slice C). Each analytic background is a
 * smooth mathematical curve (piecewise asymmetric Gaussian bells); the gradient
 * opacity at each evolution position X follows that curve, normalised between
 * its own min and max — i.e. the gradient is strongest where the curve peaks and
 * fades to nothing at its minimum. Validated against the reference images at
 * `../wardley-mockups/gradient-backgrounds.html`.
 */

const bell = (x: number, mu: number, s: number) =>
  Math.exp(-0.5 * ((x - mu) / s) ** 2);
const asym = (x: number, mu: number, sL: number, sR: number) =>
  Math.exp(-0.5 * ((x - mu) / (x < mu ? sL : sR)) ** 2);

// Opportunity — differential value (green): early peak + long decay.
const fDiff = (x: number) => asym(x, 0.175, 0.24, 0.36);
const DIFF_DOM: readonly [number, number] = [0, 0.86];
// Opportunity — operational value (red): bump centred on commodity.
const fOper = (x: number) => asym(x, 0.85, 0.1, 0.075);
const OPER_DOM: readonly [number, number] = [0.62, 1];
// Benefit / investment (signed): big positive bell − small negative bell.
const fBen = (x: number) => asym(x, 0.49, 0.17, 0.24) - 0.42 * bell(x, 0.1, 0.075);

// Evolution-gradient — Simon Wardley's classic evolution presentation: a
// symmetric grey "U", strong at both evolution extremes (uncharted /
// industrialised), fading to white through the build middle.
const fGrey = (x: number) => {
  const left = Math.max(0, (0.26 - x) / 0.26);
  const right = Math.max(0, (x - 0.64) / 0.36);
  return Math.max(left, right);
};

function rangeOf(fn: (x: number) => number, x0: number, x1: number) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i <= 240; i++) {
    const v = fn(x0 + ((x1 - x0) * i) / 240);
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return { lo, hi };
}
const RG = rangeOf(fDiff, DIFF_DOM[0], DIFF_DOM[1]);
const RR = rangeOf(fOper, OPER_DOM[0], OPER_DOM[1]);
const RB = rangeOf(fBen, 0, 1);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const norm = (v: number, lo: number, hi: number) => (hi > lo ? (v - lo) / (hi - lo) : 0);

export const GRADIENT_GREEN = '#1f9e4d';
export const GRADIENT_RED = '#d6455d';
export const GRADIENT_GREY = '#7c8389';
/** Validated peak opacity for the green/red variants. */
export const GRADIENT_MAX_OPACITY = 0.45;
/** Peak opacity for the grey evolution-gradient variant. */
export const GREY_MAX_OPACITY = 0.38;
/** Benefit/investment zero-line height (fraction of plot height from bottom). */
export const BENEFIT_ZERO_FRAC = 0.3;

function rgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Add stops to a horizontal gradient (offset 0..1 spanning the plot width) for
 * a function-driven opacity profile within [x0, x1] (zero outside).
 */
function addStops(
  grad: CanvasGradient,
  hex: string,
  opacityFn: (x: number) => number,
  x0: number,
  x1: number,
  maxOp: number = GRADIENT_MAX_OPACITY
) {
  const eps = 0.001;
  if (x0 > eps) grad.addColorStop(Math.max(0, x0 - eps), rgba(hex, 0));
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const x = x0 + ((x1 - x0) * i) / N;
    grad.addColorStop(clamp01(x), rgba(hex, clamp01(opacityFn(x)) * maxOp));
  }
  if (x1 < 1 - eps) grad.addColorStop(Math.min(1, x1 + eps), rgba(hex, 0));
}

/**
 * Paint the curve-driven gradient over the plot rectangle [px0,px1]×[py0,py1]
 * in element-local coordinates. `classic` paints nothing.
 */
export function paintGradientBackground(
  ctx: CanvasRenderingContext2D,
  variant: 'opportunity' | 'benefit' | 'evolution-gradient',
  px0: number,
  px1: number,
  py0: number,
  py1: number
) {
  const w = px1 - px0;
  const h = py1 - py0;

  if (variant === 'evolution-gradient') {
    const grey = ctx.createLinearGradient(px0, 0, px1, 0);
    addStops(grey, GRADIENT_GREY, fGrey, 0, 1, GREY_MAX_OPACITY);
    ctx.fillStyle = grey;
    ctx.fillRect(px0, py0, w, h);
    return;
  }

  if (variant === 'opportunity') {
    const green = ctx.createLinearGradient(px0, 0, px1, 0);
    addStops(green, GRADIENT_GREEN, x => norm(fDiff(x), RG.lo, RG.hi), DIFF_DOM[0], DIFF_DOM[1]);
    ctx.fillStyle = green;
    ctx.fillRect(px0, py0, w, h);

    const red = ctx.createLinearGradient(px0, 0, px1, 0);
    addStops(red, GRADIENT_RED, x => norm(fOper(x), RR.lo, RR.hi), OPER_DOM[0], OPER_DOM[1]);
    ctx.fillStyle = red;
    ctx.fillRect(px0, py0, w, h);
    return;
  }

  // benefit: green where the curve is positive, red where negative.
  const maxPos = RB.hi;
  const maxNeg = -RB.lo;
  const green = ctx.createLinearGradient(px0, 0, px1, 0);
  addStops(green, GRADIENT_GREEN, x => Math.max(0, fBen(x)) / maxPos, 0, 1);
  ctx.fillStyle = green;
  ctx.fillRect(px0, py0, w, h);

  const red = ctx.createLinearGradient(px0, 0, px1, 0);
  addStops(red, GRADIENT_RED, x => Math.max(0, -fBen(x)) / maxNeg, 0, 1);
  ctx.fillStyle = red;
  ctx.fillRect(px0, py0, w, h);
}
