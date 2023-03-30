import { describe, expect, it } from 'vitest';

import { Graph } from './graph.js';

describe('graph', () => {
  it('constructor should initialize the graph with given points', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ];

    const graph = new Graph(points);

    points.forEach(point => {
      const node = graph.getNode(point);
      expect(node).toBeDefined();
      expect(node.x).toBe(point.x);
      expect(node.y).toBe(point.y);
    });
  });

  it('neighbors should return the correct neighboring nodes', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ];

    const graph = new Graph(points);

    const neighbors = graph.neighbors(graph.getNode({ x: 1, y: 0 }));
    expect(neighbors.length).toBe(2);
    expect(neighbors[0]).toMatchObject({ x: 0, y: 0 });
    expect(neighbors[1]).toMatchObject({ x: 2, y: 0 });
  });

  it('getKey and parseKey should be reversible', () => {
    const point = { x: 3, y: 4 };
    const key = Graph.getKey(point);
    const parsedPoint = Graph.parseKey(key);

    expect(parsedPoint).toMatchObject(point);
  });

  it('cost should return the correct cost between two nodes', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ];

    const graph = new Graph(points);

    const nodeA = graph.getNode({ x: 1, y: 0 });
    const nodeB = graph.getNode({ x: 2, y: 0 });
    const nodeC = graph.getNode({ x: 0, y: 1 });

    // 设置父节点，以便正确检测方向改变
    nodeA.parent = graph.getNode({ x: 0, y: 0 });

    // 测试基本情况
    const costAB = nodeB.cost(nodeA);
    expect(costAB).toBe(1);

    // 测试方向改变情况
    const costAC = nodeC.cost(nodeA);
    expect(costAC).toBe(12);
  });
});
