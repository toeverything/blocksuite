import { assertExists } from '@blocksuite/global/utils';

import { CURVETIME_EPSILON, isZero } from './math-utils.js';
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
