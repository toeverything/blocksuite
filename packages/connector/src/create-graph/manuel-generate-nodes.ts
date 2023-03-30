import { Graph } from '../graph.js';
import type { Rectangle } from '../rectangle.js';
import type { Point } from '../simplify-path.js';
import type { CreateGraphReturned } from './types.js';

/**
 * The function checks if manual node generation is applicable under the following conditions:
 * 1. There are no rectangles.
 * 2. There is only one rectangle and two points, and:
 *    - Both points are on the left, right, top, or bottom of the rectangle.
 *    - At least one point is inside the rectangle.
 */
export function shouldManuelGenerateNodes(
  rectangles: Rectangle[],
  points: Point[]
) {
  if (!rectangles.length) {
    return true;
  }
  if (rectangles.length !== 1 || points.length !== 2) {
    return false;
  }
  const p0x = points[0].x;
  const p0y = points[0].y;
  const p1x = points[1].x;
  const p1y = points[1].y;

  const rect = rectangles[0];
  const { x, y, maxX, maxY } = rect;

  const pointsBothOnLeft = p0x <= x && p1x <= rect.x;
  const pointsBothOnRight = p0x >= maxX && p1x >= maxX;
  const pointsBothOnTop = p0y <= y && p1y <= y;
  const pointsBothOnBottom = p0y >= maxY && p1y >= maxY;
  const atLeastOnePointInside =
    rect.contains(p0x, p0y) || rect.contains(p1x, p1y);

  if (
    pointsBothOnLeft ||
    pointsBothOnRight ||
    pointsBothOnTop ||
    pointsBothOnBottom ||
    atLeastOnePointInside
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
