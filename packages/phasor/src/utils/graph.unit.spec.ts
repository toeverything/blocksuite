import { describe, expect, it } from 'vitest';

import { Bound } from './bound.js';
import { Graph } from './graph.js';

describe('graph', () => {
  it('cost', () => {
    const graph = new Graph([]);
    expect(graph.cost([0, 0, 0], [1, 1, 0])).toBe(2);
  });

  it('neighbors', () => {
    const bound = new Bound(-5, 5, 10, 10);
    const graph = new Graph(
      [
        [0, 0],
        [100, 0],
        [0, 100],
        [100, 100],
      ],
      [bound]
    );
    const neighbors = graph.neighbors([0, 0]);
    expect(neighbors.length).toBe(1);
    expect(neighbors[0][0]).toBe(100);
    expect(neighbors[0][1]).toBe(0);
  });
});
