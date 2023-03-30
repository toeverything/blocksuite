import { Graph } from '../graph.js';
import type { Rectangle } from '../rectangle.js';
import type { Point } from '../simplify-path.js';
import { createNodes } from './create-nodes.js';
import { createRulers } from './create-rulers.js';
import {
  manuelGenerateGraph,
  shouldManuelGenerateGraph,
} from './manuel-generate-graph.js';
import type { CreateGraphReturned } from './types.js';

export function createGraph(
  rectangles: Rectangle[],
  points: Point[],
  margin = [10, 10]
): CreateGraphReturned {
  if (shouldManuelGenerateGraph(rectangles, points)) {
    return manuelGenerateGraph(rectangles, points);
  }

  const inflatedRects = rectangles.map(r => r.inflate(margin[0], margin[1]));
  const rulers = createRulers(inflatedRects, points, margin);
  const nodes = createNodes(rulers, inflatedRects, points);
  const graph = new Graph(nodes);
  return {
    rectangles,
    points,
    inflatedRectangles: inflatedRects,
    rulers,
    nodes,
    graph,
  };
}
