import { describe, expect, it } from 'vitest';

import { getArrowPoints } from './utils.js';

describe('connector utils', () => {
  it('getArrowPoints', () => {
    const arrowPoints = getArrowPoints([0, 0], [10, 10], 10);
    expect(arrowPoints.start).toMatchObject([0, 0]);
    expect(arrowPoints.end).toMatchObject([10, 10]);
    expect(arrowPoints.sides).toMatchObject([
      [0, 10],
      [10, 0],
    ]);
  });
});
