import { describe, expect, it } from 'vitest';

import { Rectangle } from '../rectangle.js';
import {
  manuelGenerateGraph,
  shouldManuelGenerateNodes,
} from './manuel-generate-nodes.js';
import type { CreateGraphReturned } from './types.js';

describe('shouldManuelGenerateNodes', () => {
  it('should return true for at least one point inside', () => {
    const rectangles: Rectangle[] = [new Rectangle(2, 2, 2, 2)];
    const points = [
      { x: 3, y: 3 },
      { x: 5, y: 5 },
    ];

    const result = shouldManuelGenerateNodes(rectangles, points);
    expect(result).toBeTruthy();
  });

  it('should return false for point line cuts the rectangle', () => {
    const rectangles: Rectangle[] = [new Rectangle(2, 2, 2, 2)];
    const points = [
      { x: 1, y: 1 },
      { x: 5, y: 5 },
    ];

    const result = shouldManuelGenerateNodes(rectangles, points);
    expect(result).toBeFalsy();
  });

  it('should return false for invalid input', () => {
    const rectangles: Rectangle[] = [
      new Rectangle(2, 2, 2, 2),
      new Rectangle(6, 6, 2, 2),
    ];
    const points = [
      { x: 1, y: 1 },
      { x: 5, y: 5 },
    ];

    const result = shouldManuelGenerateNodes(rectangles, points);
    expect(result).toBeFalsy();
  });
});

describe('manuel generate nodes', () => {
  it('should generate a correct graph for given rectangles and points', () => {
    const rectangles: Rectangle[] = [new Rectangle(2, 2, 2, 2)];
    const points = [
      { x: 4, y: 4 },
      { x: 10, y: 10 },
    ];

    const expectedResult = {
      rectangles,
      points,
      inflatedRectangles: [],
      rulers: { rows: [], columns: [] },
      nodes: [
        { x: 4, y: 4 },
        { x: 10, y: 10 },
        { x: 4, y: 7 },
        { x: 10, y: 7 },
        { x: 7, y: 7 },
      ],
      graph: null,
    } as unknown as CreateGraphReturned;

    const result = manuelGenerateGraph(rectangles, points);
    expectedResult.graph = result.graph; // Assign the graph since we cannot compare the Graph objects directly

    expect(result).toMatchObject(expectedResult);
  });
});
