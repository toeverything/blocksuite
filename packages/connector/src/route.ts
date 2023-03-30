import { aStarRoute } from './a-star.js';
import { createGraph } from './create-graph.js';
import type { GraphNode } from './graph.js';
import type { Rectangle } from './rectangle.js';
import type { Point } from './simplify-path.js';
import { simplifyPath } from './simplify-path.js';

export function route(rectangles: Rectangle[], points: Point[]) {
  const { graph } = createGraph(rectangles, points);
  const start = graph.getNode(points[0]);
  const end = graph.getNode(points[1]);
  const routed = aStarRoute(graph, start, end);
  const simplifiedRoute = simplifyPath(routed) as GraphNode[];
  return simplifiedRoute;
}
