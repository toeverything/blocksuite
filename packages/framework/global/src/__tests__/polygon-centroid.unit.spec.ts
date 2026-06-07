import { describe, expect, test } from 'vitest';

import { polygonCentroid } from '../gfx/math.js';

describe('polygonCentroid', () => {
  test('unit square centroid is its center', () => {
    const c = polygonCentroid([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);
    expect(c[0]).toBeCloseTo(0.5, 10);
    expect(c[1]).toBeCloseTo(0.5, 10);
  });

  test('right triangle centroid is at one third', () => {
    const c = polygonCentroid([
      [0, 0],
      [1, 0],
      [0, 1],
    ]);
    expect(c[0]).toBeCloseTo(1 / 3, 10);
    expect(c[1]).toBeCloseTo(1 / 3, 10);
  });

  test('area centroid differs from the vertex average for non-uniform shapes', () => {
    // A "fan" with clustered vertices on one side: area centroid is pulled
    // toward the body, not the vertex cluster.
    const verts = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0.9, 1],
      [0.8, 1],
    ];
    const area = polygonCentroid(verts);
    const avg = verts.reduce(
      (a, p) => [a[0] + p[0] / verts.length, a[1] + p[1] / verts.length],
      [0, 0]
    );
    const differs =
      Math.abs(area[0] - avg[0]) > 1e-6 || Math.abs(area[1] - avg[1]) > 1e-6;
    expect(differs).toBe(true);
  });

  test('winding order does not affect the centroid', () => {
    const cw = polygonCentroid([
      [0, 0],
      [1, 0],
      [0, 1],
    ]);
    const ccw = polygonCentroid([
      [0, 0],
      [0, 1],
      [1, 0],
    ]);
    expect(cw[0]).toBeCloseTo(ccw[0], 10);
    expect(cw[1]).toBeCloseTo(ccw[1], 10);
  });

  test('degenerate inputs fall back to the vertex average', () => {
    // Fewer than 3 vertices.
    expect(polygonCentroid([[0, 0], [1, 1]])).toEqual([0.5, 0.5]);
    // Collinear (zero-area) triangle -> average of the three points.
    const collinear = polygonCentroid([
      [0, 0],
      [0.5, 0.5],
      [1, 1],
    ]);
    expect(collinear[0]).toBeCloseTo(0.5, 10);
    expect(collinear[1]).toBeCloseTo(0.5, 10);
  });

  test('empty input returns the box center', () => {
    expect(polygonCentroid([])).toEqual([0.5, 0.5]);
  });
});
