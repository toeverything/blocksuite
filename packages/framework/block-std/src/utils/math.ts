import type { IBound } from '../edgeless/types.js';

import { PointLocation } from '../edgeless/point-location.js';
import { type IVec, Vec } from '../edgeless/vec.js';

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

export function getBoundsFromPoints(points: IVec[], rotation = 0): TLBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (points.length < 1) {
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

export function getPointsFromBoundsWithRotation(
  bounds: IBound,
  getPoints: (bounds: IBound) => IVec[] = ({ x, y, w, h }: IBound) => [
    // left-top
    [x, y],
    // right-top
    [x + w, y],
    // right-bottom
    [x + w, y + h],
    // left-bottom
    [x, y + h],
  ]
): IVec[] {
  const { rotate } = bounds;
  let points = getPoints(bounds);

  if (rotate) {
    const { x, y, w, h } = bounds;
    const cx = x + w / 2;
    const cy = y + h / 2;

    const m = new DOMMatrix()
      .translateSelf(cx, cy)
      .rotateSelf(rotate)
      .translateSelf(-cx, -cy);

    points = points.map(point => {
      const { x, y } = new DOMPoint(...point).matrixTransform(m);
      return [x, y];
    });
  }

  return points;
}

export function getQuadBoundsWithRotation(bounds: IBound): DOMRect {
  const { x, y, w, h, rotate } = bounds;
  const rect = new DOMRect(x, y, w, h);

  if (!rotate) return rect;

  return new DOMQuad(
    ...getPointsFromBoundsWithRotation(bounds).map(
      point => new DOMPoint(...point)
    )
  ).getBounds();
}

export function getBoundsWithRotation(bounds: IBound): IBound {
  const { x, y, width: w, height: h } = getQuadBoundsWithRotation(bounds);
  return { x, y, w, h };
}

export function lineIntersects(
  sp: IVec,
  ep: IVec,
  sp2: IVec,
  ep2: IVec,
  infinite = false
): IVec | null {
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

export function polygonNearestPoint(points: IVec[], point: IVec) {
  const len = points.length;
  let rst: IVec;
  let dis = Infinity;
  for (let i = 0; i < len; i++) {
    const p = points[i];
    const p2 = points[(i + 1) % len];
    const temp = Vec.nearestPointOnLineSegment(p, p2, point, true);
    const curDis = Vec.dist(temp, point);
    if (curDis < dis) {
      dis = curDis;
      rst = temp;
    }
  }
  return rst!;
}

export function polygonPointDistance(points: IVec[], point: IVec) {
  const nearest = polygonNearestPoint(points, point);
  return Vec.dist(nearest, point);
}

export function almostEqual(a: number, b: number, epsilon = 0.0001) {
  return Math.abs(a - b) < epsilon;
}

export function clamp(n: number, min: number, max?: number): number {
  return Math.max(min, max !== undefined ? Math.min(n, max) : n);
}

export function rotatePoints<T extends IVec>(
  points: T[],
  center: IVec,
  rotate: number
): T[] {
  const rad = toRadian(rotate);
  return points.map(p => Vec.rotWith(p, center, rad)) as T[];
}

export function rotatePoint(
  point: [number, number],
  center: IVec,
  rotate: number
): [number, number] {
  const rad = toRadian(rotate);
  return Vec.add(center, Vec.rot(Vec.sub(point, center), rad)) as [
    number,
    number,
  ];
}

export function toRadian(angle: number) {
  return (angle * Math.PI) / 180;
}

export function isPointOnLineSegment(point: IVec, line: IVec[]) {
  const [sp, ep] = line;
  const v1 = Vec.sub(point, sp);
  const v2 = Vec.sub(point, ep);
  return almostEqual(Vec.cpr(v1, v2), 0, 0.01) && Vec.dpr(v1, v2) <= 0;
}

export function polygonGetPointTangent(points: IVec[], point: IVec): IVec {
  const len = points.length;
  for (let i = 0; i < len; i++) {
    const p = points[i];
    const p2 = points[(i + 1) % len];
    if (isPointOnLineSegment(point, [p, p2])) {
      return Vec.normalize(Vec.sub(p2, p));
    }
  }
  return [0, 0];
}

export function linePolygonIntersects(
  sp: IVec,
  ep: IVec,
  points: IVec[]
): PointLocation[] | null {
  const result: PointLocation[] = [];
  const len = points.length;

  for (let i = 0; i < len; i++) {
    const p = points[i];
    const p2 = points[(i + 1) % len];
    const rst = lineIntersects(sp, ep, p, p2);
    if (rst) {
      const v = new PointLocation(rst);
      v.tangent = Vec.normalize(Vec.sub(p2, p));
      result.push(v);
    }
  }

  return result.length ? result : null;
}
