// https://github.com/tldraw/tldraw/blob/31f0f02adf58b909f59764f62de09e97542eb2b1/packages/core/src/utils/utils.ts
// Credits to tldraw

import { Vec } from './vec.js';

interface TLBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  rotation?: number;
}

export class Utils {
  /**
   * Clamp a value into a range.
   * @param n
   * @param min
   */
  static clamp(n: number, min: number): number;
  static clamp(n: number, min: number, max: number): number;
  static clamp(n: number, min: number, max?: number): number {
    return Math.max(min, typeof max !== 'undefined' ? Math.min(n, max) : n);
  }

  /**
   * Get whether a point is inside of an ellipse.
   * @param point
   * @param center
   * @param rx
   * @param ry
   * @param rotation
   * @returns
   */
  static pointInEllipse(
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

  static pointInPolygon(p: number[], points: number[][]): boolean {
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

  /**
   * Find a bounding box from an array of points.
   * @param points
   * @param rotation (optional) The bounding box's rotation.
   */
  static getBoundsFromPoints(points: number[][], rotation = 0): TLBounds {
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
      return Utils.getBoundsFromPoints(
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

  /**
   * Turn an array of points into a path of quadratic curves.
   *
   * @param points The points returned from perfect-freehand
   * @param closed Whether the stroke is closed
   */
  static getSvgPathFromStroke(points: number[][], closed = true): string {
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
      result += `${average(a[0], b[0]).toFixed(2)},${average(
        a[1],
        b[1]
      ).toFixed(2)} `;
    }

    if (closed) {
      result += 'Z';
    }

    return result;
  }
}

export default Utils;

function average(a: number, b: number): number {
  return (a + b) / 2;
}
