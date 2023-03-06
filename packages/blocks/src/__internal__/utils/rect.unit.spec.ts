import { describe, expect, it } from 'vitest';

import { Point } from './rect.js';

describe('Point', () => {
  it('should return a min point', () => {
    const a = new Point(0, 0);
    const b = new Point(-1, 1);
    expect(Point.min(a, b)).toEqual(new Point(-1, 0));
  });

  it('should return a max point', () => {
    const a = new Point(0, 0);
    const b = new Point(-1, 1);
    expect(Point.max(a, b)).toEqual(new Point(0, 1));
  });

  it('should return a clamp point', () => {
    const min = new Point(0, 0);
    const max = new Point(1, 1);
    const a = new Point(-1, 2);
    expect(Point.clamp(a, min, max)).toEqual(new Point(0, 1));

    const b = new Point(2, 2);
    expect(Point.clamp(b, min, max)).toEqual(new Point(1, 1));

    const c = new Point(0.5, 0.5);
    expect(Point.clamp(c, min, max)).toEqual(new Point(0.5, 0.5));
  });

  it('should return a copy of point', () => {
    const a = new Point(0, 0);
    expect(a.clone()).toEqual(new Point(0, 0));
  });
});
