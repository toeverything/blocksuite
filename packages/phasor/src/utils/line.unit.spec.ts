import { Point } from '@blocksuite/blocks';
import { describe, expect, it } from 'vitest';

import { Line } from './line.js';

describe('Line', () => {
  it('should intersect', () => {
    const rst = Line.intersect(
      Point.from(0, 0),
      Point.from(1, 1),
      Point.from(0, 1),
      Point.from(1, 0)
    );
    expect(rst).toBeDefined();
    expect(rst?.equals(Point.from([0.5, 0.5]))).toBe(true);
  });

  it('should not intersect', () => {
    const rst = Line.intersect(
      Point.from(0, 0),
      Point.from(1, 0),
      Point.from(0, 1),
      Point.from(1, 1)
    );
    expect(rst).toBeNull();
  });

  it('should intersect when infinity', () => {
    const rst = Line.intersect(
      Point.from(0, 0),
      Point.from(0, 10),
      Point.from(1, 1),
      Point.from(10, 1),
      true
    );
    expect(rst).toBeDefined();
    expect(rst?.equals(Point.from(0, 1))).toBe(true);
  });
});
