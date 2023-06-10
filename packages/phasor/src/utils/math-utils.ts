// https://github.com/tldraw/tldraw/blob/31f0f02adf58b909f59764f62de09e97542eb2b1/packages/core/src/utils/utils.ts
// Credits to tldraw

import type { IBound } from '../consts.js';
import { type IVec, Vec } from './vec.js';

export const EPSILON = 1e-12;
export const MACHINE_EPSILON = 1.12e-16;

interface TLBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  rotation?: number;
}

export function isPointIn(a: IBound, x: number, y: number): boolean {
  return a.x <= x && x <= a.x + a.w && a.y <= y && y <= a.y + a.h;
}

export function intersects(a: IBound, b: IBound): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

export function almostEqual(a: number, b: number, epsilon = 0.0001) {
  return Math.abs(a - b) < epsilon;
}

export function arrayAlmostEqual(a: number[], b: number[], epsilon = 0.0001) {
  return a.length === b.length && a.every((v, i) => almostEqual(v, b[i]));
}

export function clamp(n: number, min: number, max?: number): number {
  return Math.max(min, typeof max !== 'undefined' ? Math.min(n, max) : n);
}

export function pointInEllipse(
  A: number[],
  C: number[],
  rx: number,
  ry: number,
  rotation = 0
): boolean {
  rotation = rotation || 0;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const delta = Vec.sub(A, C);
  const tdx = cos * delta[0] + sin * delta[1];
  const tdy = sin * delta[0] - cos * delta[1];

  return (tdx * tdx) / (rx * rx) + (tdy * tdy) / (ry * ry) <= 1;
}

export function pointInPolygon(p: number[], points: number[][]): boolean {
  let wn = 0; // winding number

  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    if (a[1] <= p[1]) {
      if (b[1] > p[1] && Vec.cross(a, b, p) > 0) {
        wn += 1;
      }
    } else if (b[1] <= p[1] && Vec.cross(a, b, p) < 0) {
      wn -= 1;
    }
  });

  return wn !== 0;
}

export function getBoundsFromPoints(
  points: number[][],
  rotation = 0
): TLBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (points.length < 2) {
    minX = 0;
    minY = 0;
    maxX = 1;
    maxY = 1;
  } else {
    for (const [x, y] of points) {
      minX = Math.min(x, minX);
      minY = Math.min(y, minY);
      maxX = Math.max(x, maxX);
      maxY = Math.max(y, maxY);
    }
  }

  if (rotation !== 0) {
    return getBoundsFromPoints(
      points.map(pt =>
        Vec.rotWith(pt, [(minX + maxX) / 2, (minY + maxY) / 2], rotation)
      )
    );
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

export function getSvgPathFromStroke(
  points: number[][],
  closed = true
): string {
  const len = points.length;

  if (len < 4) {
    return ``;
  }

  let a = points[0];
  let b = points[1];
  const c = points[2];

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
    2
  )},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(
    b[1],
    c[1]
  ).toFixed(2)} T`;

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(
      2
    )} `;
  }

  if (closed) {
    result += 'Z';
  }

  return result;
}

function average(a: number, b: number): number {
  return (a + b) / 2;
}

export function lineIntersects(
  sp: IVec,
  ep: IVec,
  sp2: IVec,
  ep2: IVec,
  infinite = false
) {
  const v1 = Vec.sub(ep, sp);
  const v2 = Vec.sub(ep2, sp2);
  const cross = Vec.cpr(v1, v2);
  // Avoid divisions by 0, and errors when getting too close to 0
  if (almostEqual(cross, 0, MACHINE_EPSILON)) return null;
  const d = Vec.sub(sp, sp2);
  let u1 = Vec.cpr(v2, d) / cross;
  const u2 = Vec.cpr(v1, d) / cross,
    // Check the ranges of the u parameters if the line is not
    // allowed to extend beyond the definition points, but
    // compare with EPSILON tolerance over the [0, 1] bounds.
    epsilon = /*#=*/ EPSILON,
    uMin = -epsilon,
    uMax = 1 + epsilon;

  if (infinite || (uMin < u1 && u1 < uMax && uMin < u2 && u2 < uMax)) {
    // Address the tolerance at the bounds by clipping to
    // the actual range.
    if (!infinite) {
      u1 = clamp(u1, 0, 1);
    }
    return Vec.lrp(sp, ep, u1);
  }
  return null;
}

//reference https://www.xarg.org/book/computer-graphics/line-segment-ellipse-intersection/
export function lineEllipseIntersects(
  A: IVec,
  B: IVec,
  C: IVec,
  rx: number,
  ry: number,
  rad = 0
) {
  A = Vec.rot(Vec.sub(A, C), -rad);
  B = Vec.rot(Vec.sub(B, C), -rad);

  rx *= rx;
  ry *= ry;

  const rst = [];

  const v = Vec.sub(B, A);

  const a = rx * v[1] * v[1] + ry * v[0] * v[0];
  const b = 2 * (rx * A[1] * v[1] + ry * A[0] * v[0]);
  const c = rx * A[1] * A[1] + ry * A[0] * A[0] - rx * ry;

  const D = b * b - 4 * a * c; // Discriminant

  if (D >= 0) {
    const sqrtD = Math.sqrt(D);
    const t1 = (-b + sqrtD) / (2 * a);
    const t2 = (-b - sqrtD) / (2 * a);

    if (0 <= t1 && t1 <= 1)
      rst.push(Vec.add(Vec.rot(Vec.add(Vec.mul(v, t1), A), rad), C));

    if (0 <= t2 && t2 <= 1 && Math.abs(t1 - t2) > 1e-16)
      rst.push(Vec.add(Vec.rot(Vec.add(Vec.mul(v, t2), A), rad), C));
  }

  if (rst.length === 0) return null;
  return rst;
}

export function linePolygonIntersects(
  sp: IVec,
  ep: IVec,
  points: IVec[]
): IVec[] | null {
  const result: IVec[] = [];
  const len = points.length;

  for (let i = 0; i < len; i++) {
    const p = points[i];
    const p2 = points[(i + 1) % len];
    const rst = lineIntersects(sp, ep, p, p2);
    if (rst) {
      result.push(rst);
    }
  }

  return result.length ? result : null;
}

export function linePolylineIntersects(
  sp: IVec,
  ep: IVec,
  points: IVec[]
): IVec[] | null {
  const result: IVec[] = [];
  const len = points.length;

  for (let i = 0; i < len - 1; i++) {
    const p = points[i];
    const p2 = points[i + 1];
    const rst = lineIntersects(sp, ep, p, p2);
    if (rst) {
      result.push(rst);
    }
  }

  return result.length ? result : null;
}
