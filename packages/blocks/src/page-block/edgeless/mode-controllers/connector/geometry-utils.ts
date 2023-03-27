/* eslint-disable prefer-const */

export function sub(v1: number[], v2: number[]): number[] {
  return [v1[0] - v2[0], v1[1] - v2[1]];
}

export function add(v1: number[], v2: number[]): number[] {
  return [v1[0] + v2[0], v1[1] + v2[1]];
}

export function calculateManhattanDist(p1: number[], p2: number[]): number {
  return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1]);
}

export function createKey(p: number[]): string {
  return p.join(':');
}

export function getXYDFromKey(key: string): number[] {
  return key.split(':').map(Number);
}

// Credits to PathFinding.js
// https://github.com/qiao/PathFinding.js
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

function lineLineIntersected(
  a1: number[],
  a2: number[],
  b1: number[],
  b2: number[]
): boolean {
  const uaT =
    (b2[0] - b1[0]) * (a1[1] - b1[1]) - (b2[1] - b1[1]) * (a1[0] - b1[0]);
  const ubT =
    (a2[0] - a1[0]) * (a1[1] - b1[1]) - (a2[1] - a1[1]) * (a1[0] - b1[0]);
  const uB =
    (b2[1] - b1[1]) * (a2[0] - a1[0]) - (b2[0] - b1[0]) * (a2[1] - a1[1]);

  if (uB !== 0) {
    const ua = uaT / uB;
    const ub = ubT / uB;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) return true;
  }

  return false;
}

export function lineRectIntersected(
  a1: number[],
  a2: number[],
  b: number[][]
): boolean {
  const [r0, r1, r2, r3] = b;

  if (lineLineIntersected(a1, a2, r0, r1)) return true;
  if (lineLineIntersected(a1, a2, r1, r2)) return true;
  if (lineLineIntersected(a1, a2, r2, r3)) return true;
  if (lineLineIntersected(a1, a2, r3, r0)) return true;
  return false;
}

export function rectRectIntersected(r1: number[][], r2: number[][]): boolean {
  const l = 4;

  return (
    r1.some((_, i) => lineRectIntersected(r1[i], r1[(i + 1) % l], r2)) ||
    r2.some((_, i) => lineRectIntersected(r2[i], r2[(i + 1) % l], r1))
  );
}

export function isCollinear(p1: number[], p2: number[], p3: number[]): boolean {
  const crossProduct =
    (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);
  return crossProduct === 0;
}

export function getTuringPointsCount(path: number[][]): number {
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

export function roundPoint(p: number[]): number[] {
  return p.map(Math.round);
}

export function getMidPoint(p1: number[], p2: number[]): number[] {
  return add(p1, p2).map(item => Math.round(item / 2));
}
