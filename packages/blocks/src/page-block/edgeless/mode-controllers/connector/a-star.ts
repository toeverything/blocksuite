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
  const startP = new Point(startCoord);
  const endP = new Point(endCoord);
  const path: number[][] = [];

  let isFirst = true;
  let G = 0;

  heap.add(startP);
  openMap.set(startP.key, startP);

  while (openMap.size) {
    const minP = heap.peek();
    const xy = minP.xy;

    heap.remove();
    openMap.delete(minP.key);

    if (minP.key === endP.key) {
      if (
        minP.parent &&
        !checkDirectionIsValid(minP.parent.xy, xy, endDirection)
      ) {
        continue;
      }
      let tmp: Point | null = minP;

      while (tmp) {
        path.unshift(grid.getRealPoint(tmp.xy));
        tmp = tmp.parent;
      }

      G = minP.G;

      break;
    }

    marked.set(minP.key, minP);

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
      const p = new Point(currentXY);

      if (!marked.has(p.key) && grid.getWalkable(xy, currentXY)) {
        const previous = openMap.get(p.key);
        const dir = getDirection(xy, currentXY);
        const lastDir = minP.parent ? getDirection(minP.parent.xy, xy) : null;
        const turned = lastDir !== null && lastDir !== dir;

        const G = minP.G + grid.getCost(currentXY) + (turned ? 0.02 : 0);
        const H = heuristic(currentXY, grid);

        p.setG(G);
        p.setH(H);

        if (!previous) {
          p.setParent(minP);

          heap.add(p);
          openMap.set(p.key, p);
        } else if (p.G < previous.G) {
          previous.setG(G);
          previous.setParent(minP);
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
