import { describe, expect, it } from 'vitest';

import {
  arrayAlmostEqual,
  lineEllipseIntersects,
  lineIntersects,
  linePolygonIntersects,
  linePolylineIntersects,
} from './math-utils.js';

describe('Line', () => {
  it('should intersect', () => {
    let rst = lineIntersects([0, 0], [1, 1], [0, 1], [1, 0]);
    expect(rst).toBeDefined();
    expect(rst).toMatchObject([0.5, 0.5]);

    rst = lineIntersects([5, 5], [15, 5], [10, 0], [10, 10]);
    expect(rst).toBeDefined();
    expect(rst).toMatchObject([10, 5]);
  });

  it('should not intersect', () => {
    const rst = lineIntersects([0, 0], [1, 0], [0, 1], [1, 1]);
    expect(rst).toBeNull();
  });

  it('should intersect when infinity', () => {
    const rst = lineIntersects([0, 0], [0, 10], [1, 1], [10, 1], true);
    expect(rst).toBeDefined();
    expect(rst).toMatchObject([0, 1]);
  });

  it('lineEllipseIntersects', () => {
    const rst = lineEllipseIntersects([0, -5], [0, 5], [0, 0], 1, 1);
    expect(rst).toMatchObject([
      [0, 1],
      [0, -1],
    ]);
  });

  it('lineEllipseIntersects with rotate', () => {
    const rst = lineEllipseIntersects(
      [0, -5],
      [0, 5],
      [0, 0],
      3,
      2,
      Math.PI / 2
    );
    expect(rst).toBeDefined();
    if (rst) {
      arrayAlmostEqual(rst[0], [0, 3]);
      arrayAlmostEqual(rst[1], [0, -3]);
    }
  });

  it('linePolygonIntersects', () => {
    const rst = linePolygonIntersects(
      [5, 5],
      [15, 5],
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ]
    );

    expect(rst).toMatchObject([[10, 5]]);
  });

  it('linePolylineIntersects', () => {
    const rst = linePolylineIntersects(
      [5, 5],
      [-5, 5],
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ]
    );

    expect(rst).toBeNull();
  });
});
