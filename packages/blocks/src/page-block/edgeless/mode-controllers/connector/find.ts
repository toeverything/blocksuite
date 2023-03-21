import { AStar } from './a-star.js';
import { getNumberOfInflectionPoints } from './geometry.js';
import type { Grid } from './grid0.js';
import { checkCanFollowWaypoint } from './layout-util.js';
import type { PathFindingPointData } from './type.js';
import { calculateManhattanDist } from './util.js';

export const find = (
  grid: Grid,
  {
    startInfo,
    endInfo,
    waypoint,
    isCovered,
    checkWaypointWalkable,
  }: {
    startInfo: PathFindingPointData;
    endInfo: PathFindingPointData;
    waypoint?: number[];
    isCovered: boolean;
    checkWaypointWalkable: (from: number[], to: number[]) => boolean;
  }
) => {
  const followWaypoint =
    waypoint &&
    checkCanFollowWaypoint(
      startInfo,
      endInfo,
      waypoint,
      grid,
      checkWaypointWalkable
    );

  const heuristic = (current: number[], grid: Grid) => {
    const h1 = calculateManhattanDist(
      current,
      grid.getGridPoint(endInfo.endpoint)
    );

    if (!followWaypoint) {
      return h1;
    }

    return h1 + calculateManhattanDist(current, grid.getGridPoint(waypoint!));
  };

  if (isCovered) {
    const temp = AStar(
      grid,
      startInfo.endpoint,
      endInfo.endpoint,
      startInfo.direction,
      endInfo.direction,
      heuristic
    );
    temp.path.push(endInfo.origin);
    temp.path.unshift(startInfo.origin);

    return temp;
  }

  const result = [0, 1, 2, 4]
    .map(index =>
      AStar(
        grid,
        startInfo.endpoint,
        endInfo.endpoint,
        startInfo.direction,
        endInfo.direction,
        heuristic,
        index
      )
    )
    .filter(item => item.path.length);

  let target: { path: number[][]; grid: Grid; G: number } | null = null;
  let min1 = Infinity;
  let min2 = Infinity;

  result.forEach(item => {
    const completedPath = [...item.path];

    completedPath.push(endInfo.origin);
    completedPath.unshift(startInfo.origin);

    const d1 = getNumberOfInflectionPoints(item.path);
    const d2 = getNumberOfInflectionPoints(completedPath);

    /**
     * 1. 拐点数都相同时取最小的 G
     * 2. 先取不包含起始点的最小拐点数，再判断包含了起始点的最小拐点数
     */
    if (
      d1 < min1 ||
      (d1 === min1 && d2 < min2) ||
      (d1 === min1 && d2 === min2 && item.G < target!.G)
    ) {
      min1 = d1;
      min2 = d2;
      target = item;
    }
  });

  if (!target) {
    target = {
      grid,
      path: [],
      G: Infinity,
    };

    console.warn('Path not found');
  }

  target!.path.push(endInfo.origin);
  target!.path.unshift(startInfo.origin);

  return target;
};
