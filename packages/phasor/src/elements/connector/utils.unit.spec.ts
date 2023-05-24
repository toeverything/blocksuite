import { describe, expect, it } from 'vitest';

import { getArrowPoints } from './utils.js';

describe('connector utils', () => {
  it('getArrowPoints', () => {
    const arrowPoints = getArrowPoints([0, 0], [10, 10], 10);
    expect(arrowPoints.start).toMatchObject([0, 0]);
    expect(arrowPoints.end).toMatchObject([10, 10]);
    expect(arrowPoints.sides).toMatchObject([
      [1.0899347581163212, 5.4600950026045325],
      [5.460095002604532, 1.0899347581163212],
    ]);
  });
});
