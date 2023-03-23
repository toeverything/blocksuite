/* eslint-disable prefer-const */
import { addV, calculateEuclideanDist, subV } from './util.js';

// 见 pathfindingjs
export function compressPath(path: number[][]): number[][] {
  // nothing to compress
  if (path.length < 3) {
    return path;
  }

  let compressed = [],
    sx = path[0][0], // start x
    sy = path[0][1], // start y
    px = path[1][0], // second point x
    py = path[1][1], // second point y
    dx = px - sx, // direction between the two points
    dy = py - sy, // direction between the two points
    lx,
    ly,
    ldx,
    ldy,
    sq,
    i;

  // normalize the direction
  sq = Math.sqrt(dx * dx + dy * dy);
  dx /= sq;
  dy /= sq;

  // start the new path
  compressed.push([sx, sy]);

  for (i = 2; i < path.length; i++) {
    // store the last point
    lx = px;
    ly = py;

    // store the last direction
    ldx = dx;
    ldy = dy;

    // next point
    px = path[i][0];
    py = path[i][1];

    // next direction
    dx = px - lx;
    dy = py - ly;

    // normalize
    sq = Math.sqrt(dx * dx + dy * dy);
    dx /= sq;
    dy /= sq;

    // if the direction has changed, store the point
    if (dx !== ldx || dy !== ldy) {
      compressed.push([lx, ly]);
    }
  }

  // store the last point
  compressed.push([px, py]);

  return compressed;
}

export function lineLine(
  a1: number[],
  a2: number[],
  b1: number[],
  b2: number[]
) {
  // b1->b2向量 与 a1->b1向量的向量积
  const ua_t =
    (b2[0] - b1[0]) * (a1[1] - b1[1]) - (b2[1] - b1[1]) * (a1[0] - b1[0]);
  // a1->a2向量 与 a1->b1向量的向量积
  const ub_t =
    (a2[0] - a1[0]) * (a1[1] - b1[1]) - (a2[1] - a1[1]) * (a1[0] - b1[0]);
  // a1->a2向量 与 b1->b2向量的向量积
  const u_b =
    (b2[1] - b1[1]) * (a2[0] - a1[0]) - (b2[0] - b1[0]) * (a2[1] - a1[1]);
  // u_b == 0时，角度为0或者180 平行或者共线不属于相交
  if (u_b !== 0) {
    const ua = ua_t / u_b;
    const ub = ub_t / u_b;

    if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
      return true;
    }
  }

  return false;
}

export function lineRect(a1: number[], a2: number[], b: number[][]): boolean {
  const [r0, r1, r2, r3] = b;

  if (lineLine(a1, a2, r0, r1)) return true;
  if (lineLine(a1, a2, r1, r2)) return true;
  if (lineLine(a1, a2, r2, r3)) return true;
  if (lineLine(a1, a2, r3, r0)) return true;
  return false;
}

export function rectRect(r1: number[][], r2: number[][]): boolean {
  const l = 4;

  return (
    r1.some((_, i) => lineRect(r1[i], r1[(i + 1) % l], r2)) ||
    r2.some((_, i) => lineRect(r2[i], r2[(i + 1) % l], r1))
  );
}

export function isCollinear(p: number[], q: number[], t: number[]): boolean {
  const accuracy = 0;
  // 3点围成的三角形面积
  const area =
    p[0] * q[1] -
    p[1] * q[0] +
    q[0] * t[1] -
    q[1] * t[0] +
    t[0] * p[1] -
    t[1] * p[0];
  const edge = calculateEuclideanDist(p, q);

  return Math.abs(area / edge) <= accuracy;
}

export function getNumberOfInflectionPoints(path: number[][]): number {
  if (path.length < 3) {
    return 0;
  }

  let count = 0;

  for (let i = 1; i < path.length - 1; i++) {
    if (!isCollinear(path[i - 1], path[i + 1], path[i])) {
      count++;
    }
  }

  return count;
}

export function splitPath(path: number[][]): number[][][] {
  const result: number[][][] = [];
  let current: number[][] = [];

  current.push(path[0]);

  for (let i = 1; i < path.length - 1; i++) {
    current.push(path[i]);
    if (!isCollinear(path[i - 1], path[i + 1], path[i])) {
      result.push(current);
      current = [path[i]];
    }
  }

  current.push(path[path.length - 1]);

  result.push(current);

  return result.map(item => item.map(v => v.slice()));
}

export function smoothPath(path: number[][][], maxRadius: number): string[] {
  const result: string[] = [];
  const cloned = path.map(item => item.map(v => v.slice()));

  for (let i = 0; i < cloned.length - 1; i++) {
    const next = cloned[i + 1];
    const current = cloned[i];
    const originCurrent = path[i];
    const originNext = path[i + 1];

    const currentPoint = current[current.length - 1];
    const nextPoint = next[0];

    const d = subV(originCurrent[originCurrent.length - 2], originNext[1]);
    const radius = Math.min(
      maxRadius,
      ...d.map(item => (Math.abs(item) - 2) / 2)
    );

    const base = originCurrent[originCurrent.length - 1];

    const d1 = subV(base, originCurrent[originCurrent.length - 2]);
    const d2 = subV(originNext[0], originNext[1]);

    [
      [currentPoint, d1],
      [nextPoint, d2],
    ].forEach(([p, di]) => {
      p[0] -= Math.sign(di[0]) * radius;
      p[1] -= Math.sign(di[1]) * radius;
    });

    result.push(
      `M ${current[0][0]} ${current[0][1]} L ${currentPoint[0]} ${currentPoint[1]}`
    );

    if (radius > 0) {
      result.push(
        `M ${currentPoint[0]} ${currentPoint[1]}  Q ${base[0]} ${base[1]}, ${nextPoint[0]} ${nextPoint[1]}`
      );
    }
  }

  const last = cloned[path.length - 1];

  result.push(
    `M ${last[0][0]} ${last[0][1]} L ${last[last.length - 1][0]} ${
      last[last.length - 1][1]
    }`
  );

  return result;
}

export function roundPoint(p: number[]): number[] {
  return p.map(Math.round);
}

export function getMidPoint(p1: number[], p2: number[]): number[] {
  return addV(p1, p2).map(item => Math.round(item / 2));
}
