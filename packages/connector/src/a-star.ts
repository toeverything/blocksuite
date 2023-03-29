import type { Graph, GraphNode } from './graph.js';
import { BinaryHeap } from './heap.js';
import type { Point } from './util.js';

type HeuristicFunction = (start: Point, end: Point) => number;

function manhattan(start: Point, end: Point) {
  return Math.abs(start.x - end.x) + Math.abs(start.y - end.y);
}

function pathTo(element: GraphNode) {
  let curr = element;
  const path = [];
  while (curr.parent) {
    path.unshift(curr);
    curr = curr.parent;
  }
  path.unshift(curr);
  return path;
}

export function aStarRoute(
  graph: Pick<Graph, 'neighbors'>,
  start: GraphNode,
  end: GraphNode,
  heuristic: HeuristicFunction = manhattan
) {
  const openHeap = new BinaryHeap<GraphNode>(element => element.f);

  start.h = heuristic(start, end);

  openHeap.push(start);

  while (openHeap.size() > 0) {
    // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
    const currentNode = openHeap.pop();

    // End case -- result has been found, return the traced path.
    if (currentNode === end) {
      return pathTo(currentNode);
    }

    // Normal case -- move currentNode from open to closed, process each of its neighbors.
    currentNode.closed = true;

    // Find all neighbors for the current node.
    const neighbors = graph.neighbors(currentNode);

    for (let i = 0, il = neighbors.length; i < il; ++i) {
      const neighbor = neighbors[i];

      if (neighbor.closed) {
        // Not a valid node to process, skip to next neighbor.
        continue;
      }

      // The g score is the shortest distance from start to current node.
      // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
      const gScore = currentNode.g + neighbor.cost(currentNode);
      const beenVisited = neighbor.visited;

      if (!beenVisited || gScore < neighbor.g) {
        // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
        neighbor.visited = true;
        neighbor.parent = currentNode;
        neighbor.h = neighbor.h || heuristic(neighbor, end);
        neighbor.g = gScore;
        neighbor.f = neighbor.g + neighbor.h;

        if (!beenVisited) {
          // Pushing to heap will put it in proper place based on the 'f' value.
          openHeap.push(neighbor);
        } else {
          // Already seen the node, but since it has been rescored we need to reorder it in the heap
          openHeap.rescoreElement(neighbor);
        }
      }
    }
  }

  // No result was found - empty array signifies failure to find path.
  return [];
}
