import { Direction } from './constants.js';
import { compressPath } from './geometry.js';
import type { Grid } from './grid0.js';
import { Heap } from './heap.js';
import { checkDirectionIsValid, getMoveDelta } from './layout-util.js';
import { Point } from './point.js';
import { addV, subV } from './util.js';

const heap = new Heap<Point>();
const marked = new Map<string, Point>();
const openMap = new Map<string, Point>();

function getDirection(from: number[], to: number[]) {
  const v = subV(to, from);

  if (v[0] === 0) {
    return v[1] > 0 ? Direction.BOTTOM : Direction.TOP;
  }

  return v[0] > 0 ? Direction.RIGHT : Direction.LEFT;
}

export function AStar(
  grid: Grid,
  start: number[],
  end: number[],
  startDirection: Direction,
  endDirection: Direction,
  heuristic: (current: number[], grid: Grid) => number,
  index?: number
) {
  const startCoord = grid.getGridPoint(start);
  const endCoord = grid.getGridPoint(end);

  // 为了保证经过凸起 start end 在计算完成后加入
  const startPoint = new Point(startCoord);
  const endPoint = new Point(endCoord);
  const path: number[][] = [];

  let isFirst = true;
  let G = 0;

  heap.add(startPoint);
  openMap.set(startPoint.key, startPoint);

  while (openMap.size) {
    const minPoint = heap.peek();
    const xy = minPoint.xy;

    heap.remove();
    openMap.delete(minPoint.key);

    if (minPoint.key === endPoint.key) {
      if (
        minPoint.parent &&
        !checkDirectionIsValid(minPoint.parent.xy, xy, endDirection)
      ) {
        continue;
      }
      let tmp: Point | null = minPoint;

      while (tmp) {
        path.unshift(grid.getRealPoint(tmp.xy));
        tmp = tmp.parent;
      }

      G = minPoint.G;

      break;
    }

    marked.set(minPoint.key, minPoint);

    const move = getMoveDelta(startDirection, isFirst);
    const neighbors =
      index !== undefined
        ? isFirst
          ? move.slice(index, index + 1)
          : move
        : move;
    isFirst = false;

    neighbors.forEach(([dx, dy]) => {
      const currentXY = addV(xy, [dx, dy]);
      const point = new Point(currentXY);

      if (!marked.has(point.key) && grid.isWalkable(xy, currentXY)) {
        const previous = openMap.get(point.key);
        const dir = getDirection(xy, currentXY);
        const lastDir = minPoint.parent
          ? getDirection(minPoint.parent.xy, xy)
          : null;
        const turned = lastDir !== null && lastDir !== dir;

        point.G = minPoint.G + grid.getCost(currentXY) + (turned ? 0.02 : 0);
        point.H = heuristic(currentXY, grid);

        if (!previous) {
          point.setParent(minPoint);

          heap.add(point);
          openMap.set(point.key, point);
        } else if (point.G < previous.G) {
          previous.G = G;
          previous.setParent(minPoint);
        }
      }
    });
  }

  heap.clear();
  openMap.clear();
  marked.clear();

  return {
    path: compressPath(path),
    grid,
    G,
  };
}
