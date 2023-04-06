import type { Graph } from '../graph.js';
import type { Rectangle } from '../rectangle.js';
import type { Point } from '../simplify-path.js';

export interface Rulers {
  columns: number[];
  rows: number[];
}

export interface CreateGraphReturned {
  rectangles: Rectangle[];
  points: Point[];

  inflatedRectangles: Rectangle[];

  rulers: Rulers;
  nodes: Point[];
  graph: Graph;
}
