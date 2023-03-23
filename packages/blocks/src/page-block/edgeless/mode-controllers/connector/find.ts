import { runAStar } from './a-star.js';
import {
  calculateManhattanDist,
  getTuringPointsCount,
} from './geometry-utils.js';
import type { Grid } from './grid.js';
import { checkCanFollowWaypoint } from './layout-utils.js';
import type { PathFindingPointData } from './type.js';

function calculateHeuristic(
  current: number[],
  grid: Grid,
  endInfo: PathFindingPointData,
  followWaypoint: boolean,
  waypoint?: number[]
) {
  const h1 = calculateManhattanDist(
    current,
    grid.getGridPoint(endInfo.endpoint)
  );

  if (!followWaypoint) return h1;

  return h1 + calculateManhattanDist(current, grid.getGridPoint(waypoint!));
}

export function find(
  grid: Grid,
  {
    startInfo,
    endInfo,
    waypoint,
    isCovered,
    waypointWalkableGetter,
  }: {
    startInfo: PathFindingPointData;
    endInfo: PathFindingPointData;
    waypoint?: number[];
    isCovered: boolean;
    waypointWalkableGetter: (from: number[], to: number[]) => boolean;
  }
) {
  const followWaypoint = !!(
    waypoint &&
    checkCanFollowWaypoint(
      startInfo,
      endInfo,
      waypoint,
      grid,
      waypointWalkableGetter
    )
  );

  const heuristicGetter = (current: number[], grid: Grid) => {
    return calculateHeuristic(current, grid, endInfo, followWaypoint, waypoint);
  };

  if (isCovered) {
    const temp = runAStar(
      grid,
      startInfo.endpoint,
      endInfo.endpoint,
      startInfo.direction,
      endInfo.direction,
      heuristicGetter
    );
    temp.path.push(endInfo.origin);
    temp.path.unshift(startInfo.origin);

    return temp;
  }

  const result = [0, 1, 2, 4]
    .map(index =>
      runAStar(
        grid,
        startInfo.endpoint,
        endInfo.endpoint,
        startInfo.direction,
        endInfo.direction,
        heuristicGetter,
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

    const d1 = getTuringPointsCount(item.path);
    const d2 = getTuringPointsCount(completedPath);

    /**
     * 1. When the number of turing points are the same, take the one with smallest G.
     * 2. Take the smallest number of turing points without the starting point first,
     * and then test the smallest number of turning points that includes the starting point.
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
}
