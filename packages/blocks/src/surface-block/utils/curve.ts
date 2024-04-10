import { assertExists } from '@blocksuite/global/utils';

import { Bound } from './bound.js';
import { CURVETIME_EPSILON, isZero } from './math-utils.js';
import type { PointLocation } from './point-location.js';
import { type IVec, Vec } from './vec.js';

// control coords are not relative to start or end
export type BezierCurveParameters = [
  start: IVec,
  control1: IVec,
  control2: IVec,
  end: IVec,
];

function evaluate(
  v: BezierCurveParameters,
  t: number,
  type: number,
  normalized: boolean
): IVec | null {
  if (t == null || t < 0 || t > 1) return null;
  const x0 = v[0][0],
    y0 = v[0][1],
    x3 = v[3][0],
    y3 = v[3][1];
  let x1 = v[1][0],
    y1 = v[1][1],
    x2 = v[2][0],
    y2 = v[2][1];

  if (isZero(x1 - x0) && isZero(y1 - y0)) {
    x1 = x0;
    y1 = y0;
  }
  if (isZero(x2 - x3) && isZero(y2 - y3)) {
    x2 = x3;
    y2 = y3;
  }
  // Calculate the polynomial coefficients.
  const cx = 3 * (x1 - x0),
    bx = 3 * (x2 - x1) - cx,
    ax = x3 - x0 - cx - bx,
    cy = 3 * (y1 - y0),
    by = 3 * (y2 - y1) - cy,
    ay = y3 - y0 - cy - by;
  let x, y;
  if (type === 0) {
    // type === 0: getPoint()
    x = t === 0 ? x0 : t === 1 ? x3 : ((ax * t + bx) * t + cx) * t + x0;
    y = t === 0 ? y0 : t === 1 ? y3 : ((ay * t + by) * t + cy) * t + y0;
  } else {
    // type === 1: getTangent()
    // type === 2: getNormal()
    // type === 3: getCurvature()
    const tMin = CURVETIME_EPSILON,
      tMax = 1 - tMin;
    if (t < tMin) {
      x = cx;
      y = cy;
    } else if (t > tMax) {
      x = 3 * (x3 - x2);
      y = 3 * (y3 - y2);
    } else {
      x = (3 * ax * t + 2 * bx) * t + cx;
      y = (3 * ay * t + 2 * by) * t + cy;
    }
    if (normalized) {
      if (x === 0 && y === 0 && (t < tMin || t > tMax)) {
        x = x2 - x1;
        y = y2 - y1;
      }
      const len = Math.sqrt(x * x + y * y);
      if (len) {
        x /= len;
        y /= len;
      }
    }
    if (type === 3) {
      const x2 = 6 * ax * t + 2 * bx,
        y2 = 6 * ay * t + 2 * by,
        d = Math.pow(x * x + y * y, 3 / 2);
      x = d !== 0 ? (x * y2 - y * x2) / d : 0;
      y = 0;
    }
  }
  return type === 2 ? [y, -x] : [x, y];
}

export function getBezierPoint(values: BezierCurveParameters, t: number) {
  return evaluate(values, t, 0, false);
}

export function getBezierTangent(values: BezierCurveParameters, t: number) {
  return evaluate(values, t, 1, true);
}

export function getBezierNormal(values: BezierCurveParameters, t: number) {
  return evaluate(values, t, 2, true);
}

export function getBezierCurvature(values: BezierCurveParameters, t: number) {
  return evaluate(values, t, 3, false)?.[0];
}

export function getBezierNearestTime(
  values: BezierCurveParameters,
  point: IVec
) {
  const count = 100;
  let minDist = Infinity,
    minT = 0;

  function refine(t: number) {
    if (t >= 0 && t <= 1) {
      const tmpPoint = getBezierPoint(values, t);
      assertExists(tmpPoint);
      const dist = Vec.dist2(point, tmpPoint);
      if (dist < minDist) {
        minDist = dist;
        minT = t;
        return true;
      }
    }
    return false;
  }

  for (let i = 0; i <= count; i++) refine(i / count);

  let step = 1 / (count * 2);
  while (step > CURVETIME_EPSILON) {
    if (!refine(minT - step) && !refine(minT + step)) step /= 2;
  }
  return minT;
}

export function getBezierNearestPoint(
  values: BezierCurveParameters,
  point: IVec
) {
  const t = getBezierNearestTime(values, point);
  const pointOnCurve = getBezierPoint(values, t);
  assertExists(pointOnCurve);
  return pointOnCurve;
}

export function getBezierParameters(
  points: PointLocation[]
): BezierCurveParameters {
  return [points[0], points[0].absOut, points[1].absIn, points[1]];
}

// https://stackoverflow.com/questions/2587751/an-algorithm-to-find-bounding-box-of-closed-bezier-curves
export function getBezierCurveBoundingBox(values: BezierCurveParameters) {
  const [start, controlPoint1, controlPoint2, end] = values;

  const [x0, y0] = start;
  const [x1, y1] = controlPoint1;
  const [x2, y2] = controlPoint2;
  const [x3, y3] = end;

  const points = []; // local extremes
  const tvalues = []; // t values of local extremes
  const bounds: [number[], number[]] = [[], []];

  let a;
  let b;
  let c;
  let t;
  let t1;
  let t2;
  let b2ac;
  let sqrtb2ac;

  for (let i = 0; i < 2; i += 1) {
    if (i === 0) {
      b = 6 * x0 - 12 * x1 + 6 * x2;
      a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
      c = 3 * x1 - 3 * x0;
    } else {
      b = 6 * y0 - 12 * y1 + 6 * y2;
      a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
      c = 3 * y1 - 3 * y0;
    }

    if (Math.abs(a) < 1e-12) {
      if (Math.abs(b) < 1e-12) {
        continue;
      }

      t = -c / b;
      if (t > 0 && t < 1) tvalues.push(t);

      continue;
    }

    b2ac = b * b - 4 * c * a;
    sqrtb2ac = Math.sqrt(b2ac);

    if (b2ac < 0) continue;

    t1 = (-b + sqrtb2ac) / (2 * a);
    if (t1 > 0 && t1 < 1) tvalues.push(t1);

    t2 = (-b - sqrtb2ac) / (2 * a);
    if (t2 > 0 && t2 < 1) tvalues.push(t2);
  }

  let x;
  let y;
  let mt;
  let j = tvalues.length;
  const jlen = j;

  while (j) {
    j -= 1;
    t = tvalues[j];
    mt = 1 - t;

    x =
      mt * mt * mt * x0 +
      3 * mt * mt * t * x1 +
      3 * mt * t * t * x2 +
      t * t * t * x3;
    bounds[0][j] = x;

    y =
      mt * mt * mt * y0 +
      3 * mt * mt * t * y1 +
      3 * mt * t * t * y2 +
      t * t * t * y3;

    bounds[1][j] = y;
    points[j] = { X: x, Y: y };
  }

  tvalues[jlen] = 0;
  tvalues[jlen + 1] = 1;

  points[jlen] = { X: x0, Y: y0 };
  points[jlen + 1] = { X: x3, Y: y3 };

  bounds[0][jlen] = x0;
  bounds[1][jlen] = y0;

  bounds[0][jlen + 1] = x3;
  bounds[1][jlen + 1] = y3;

  tvalues.length = jlen + 2;
  bounds[0].length = jlen + 2;
  bounds[1].length = jlen + 2;
  points.length = jlen + 2;

  const left = Math.min.apply(null, bounds[0]);
  const top = Math.min.apply(null, bounds[1]);
  const right = Math.max.apply(null, bounds[0]);
  const bottom = Math.max.apply(null, bounds[1]);

  return new Bound(left, top, right - left, bottom - top);
}
