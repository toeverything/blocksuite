import { describe, expect, it } from 'vitest';

import { Rectangle } from '../rectangle.js';
import { createRulers } from './create-rulers.js';

const rectangles = [new Rectangle(2, 2, 2, 2), new Rectangle(6, 6, 2, 2)];

const points = [
  { x: 0, y: 0 },
  { x: 10, y: 10 },
];

const margin = [2, 2];

describe('createRulers', () => {
  it('createRulers should return the correct rulers for columns and rows', () => {
    const rulers = createRulers(rectangles, points, margin);

    expect(rulers).toMatchObject({
      columns: [-2, 0, 2, 4, 6, 8, 10, 12],
      rows: [-2, 0, 2, 4, 6, 8, 10, 12],
    });
  });
});
