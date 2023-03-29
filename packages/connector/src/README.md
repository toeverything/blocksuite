# Connector

## How to use

```
import { createGraph, route, Rectangle, simplifyPath } from '@blocksuite/connector';

const rects = [
  new Rectangle(30, 30, 200, 200),
  new Rectangle(160, 160, 300, 300)
]

const points = [
  { x: 50, y: 30 },
  { x: 160, y: 200 }
]

const { graph } = createGraph(rects, points);

const path = route(
  graph,
  graph.get(points[0].x, points[0].y),
  graph.get(points[1].x, points[1].y)
)
console.log('path', path);

const simplifiedPath = simplifyPath(path);
console.log('simplified path', simplifiedPath);
```

## Example

See `packages/playground/examples/canvas/connector.html`

## Info

The main idea comes from https://medium.com/swlh/routing-orthogonal-diagram-connectors-in-javascript-191dc2c5ff70 .
The final implementation is based on the idea of the blog and modifies the following parts:

- When generating graph, do not rely on the binding of rectangle and point
- When generating graphs, do not limit the number of rectangles and points
- When the path is finally calculated, select any two points from the graph
- When there are only two points or only one rectangle, manually generate the points of the graph

Problems caused by modifications:

- The Graph becomes larger, and more points.length lines are added, causing the final path point to increase points.length \* 2n

## Reference:

Blog：

- Orthogonal connector: https://medium.com/swlh/routing-orthogonal-diagram-connectors-in-javascript-191dc2c5ff70
- A-star: https://www.redblobgames.com/pathfinding/a-star/introduction.html

Code:

- Orthogonal connector: https://gist.github.com/jose-mdz/4a8894c152383b9d7a870c24a04447e4
- A-star: https://github.com/bgrins/javascript-astar

Visualized path finding:

- https://qiao.github.io/PathFinding.js/visual/
