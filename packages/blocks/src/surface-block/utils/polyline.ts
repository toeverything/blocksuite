import { type IVec2, Vec } from './vec.js';

export class Polyline {
  static len(points: IVec2[]) {
    const n = points.length;
    let i = 0;
    let len = 0;
    let prev = points[0];
    let curr: IVec2;

    while (++i < n) {
      curr = points[i];
      len += Vec.dist(prev, curr);
      prev = curr;
    }

    return len;
  }

  static pointAt(points: IVec2[], ratio: number) {
    const n = points.length;
    if (n === 0) {
      return null;
    }

    if (n === 1) {
      return points[0];
    }

    if (ratio <= 0) {
      return points[0];
    }

    if (ratio >= 1) {
      return points[n - 1];
    }

    const total = Polyline.len(points);
    const len = total * ratio;
    return Polyline.pointAtLen(points, len);
  }

  static pointAtLen(points: IVec2[], len: number): number[] | null {
    const n = points.length;
    if (n === 0) {
      return null;
    }

    if (n === 1) {
      return points[0];
    }

    let fromStart = true;
    if (len < 0) {
      fromStart = false;
      len = -len;
    }

    let tmp = 0;
    for (let j = 0, k = n - 1; j < k; j++) {
      const i = fromStart ? j : k - 1 - j;
      const a = points[i];
      const b = points[i + 1];
      const d = Vec.dist(a, b);

      if (len <= tmp + d) {
        const t = ((fromStart ? 1 : -1) * (len - tmp)) / d;
        return Vec.lrp(a, b, t);
      }

      tmp += d;
    }

    const lastPoint = fromStart ? points[n - 1] : points[0];
    return lastPoint;
  }
}
