import { Graph } from '../graph.js';
import type { Rectangle } from '../rectangle.js';
import type { Point } from '../simplify-path.js';
import type { CreateGraphReturned } from './types.js';

export function shouldManuelGenerateNodes(
  rectangles: Rectangle[],
  points: Point[]
) {
  if (!rectangles.length) {
    return true;
  }
  if (
    rectangles.length === 1 &&
    points.length === 2 &&
    ((points[0].x <= rectangles[0].x && points[1].x <= rectangles[0].x) ||
      (points[0].x >= rectangles[0].maxX &&
        points[1].x >= rectangles[0].maxX) ||
      (points[0].y <= rectangles[0].y && points[1].y <= rectangles[0].y) ||
      (points[0].y >= rectangles[0].maxY && points[1].y >= rectangles[0].maxY))
  ) {
    return true;
  }
  return false;
}

// Generates a set of nodes manually given a set of rectangles and points.
// This is useful for simpler cases where path-finding generation is not required.
export function manuelGenerateGraph(
  rectangles: Rectangle[],
  points: Point[]
): CreateGraphReturned {
  // Determine if the rectangles and points are aligned vertically.
  const isVertical =
    rectangles.length === 1 &&
    ((points[0].y <= rectangles[0].y && points[1].y <= rectangles[0].y) ||
      (points[0].y >= rectangles[0].maxY && points[1].y >= rectangles[0].maxY));

  // Calculate the edge centers based on whether the alignment is vertical or horizontal.
  const edgeCenters = isVertical
    ? [
        { x: points[0].x, y: (points[0].y + points[1].y) / 2 },
        { x: points[1].x, y: (points[0].y + points[1].y) / 2 },
      ]
    : [
        { x: (points[0].x + points[1].x) / 2, y: points[0].y },
        { x: (points[0].x + points[1].x) / 2, y: points[1].y },
      ];

  // Create an array of nodes that include the provided points, edge centers,
  // and the center of the two points.
  const nodes = [
    ...points,
    ...edgeCenters,
    {
      x: (points[0].x + points[1].x) / 2,
      y: (points[0].y + points[1].y) / 2,
    },
  ];

  const graph = new Graph(nodes);

  return {
    rectangles,
    points,
    inflatedRectangles: [],
    rulers: { rows: [], columns: [] },
    nodes,
    graph,
  };
}
