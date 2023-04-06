import { describe, expect, it } from 'vitest';

import { aStarRoute } from './a-star.js';
import { createGraph } from './create-graph/create-graph.js';
import { Rectangle } from './rectangle.js';

describe('a-start', () => {
  it('basic', () => {
    const rects = [
      new Rectangle(30, 30, 200, 200),
      new Rectangle(160, 160, 300, 300),
    ];
    const points = [
      { x: 130, y: 30 },
      { x: 160, y: 310 },
    ];
    const { graph } = createGraph(rects, points);
    const path = aStarRoute(
      graph,
      graph.getNode(points[0]),
      graph.getNode(points[1])
    );
    const pathStr = path.map(p => `${p.x}:${p.y}`).join(',');

    const result =
      '130:30,130:25,130:20,130:10,75:10,20:10,10:10,10:20,10:25,10:30,10:90,10:150,10:195,10:240,10:275,10:310,20:310,75:310,130:310,140:310,150:310,155:310,160:310';
    expect(pathStr).toBe(result);
  });
});
