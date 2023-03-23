import type { Direction } from './constants.js';
import { find } from './find.js';
import {
  getMidPoint,
  lineRectIntersected,
  rectRectIntersected,
} from './geometry-utils.js';
import { Grid } from './grid.js';
import {
  extendBox,
  getBoxConstraintsInfo,
  getIntersectPoints,
  inView,
  isOppositeDirection,
  uniquePoints,
} from './layout-utils.js';

function getPathFindingData(
  start: {
    box?: number[][];
    origin: number[];
    direction: Direction;
  },
  end: {
    box?: number[][];
    origin: number[];
    direction: Direction;
  },
  minDist: number
) {
  // Two boxes intersect
  const isIntersected =
    start.box && end.box ? rectRectIntersected(start.box, end.box) : false;
  const testBoxs = [
    [start.origin, end.box],
    [end.origin, start.box],
  ].filter(item => item[1]) as [number[], number[][]][];

  // Start and end are both covered by another box
  const isCovered = testBoxs.every(([p, box]) => inView(p, box));
  const [startInfo, endInfo] = getBoxConstraintsInfo(
    start,
    end,
    minDist,
    isCovered
  );

  const midPoint = getMidPoint(startInfo.endpoint, endInfo.endpoint);
  const middlePoints = [
    [startInfo.endpoint[0], midPoint[1]],
    [endInfo.endpoint[0], midPoint[1]],
    [midPoint[0], startInfo.endpoint[1]],
    [midPoint[0], endInfo.endpoint[1]],
    midPoint,
  ];

  const waypoint = midPoint;
  const allPoints: number[][] = [
    startInfo.endpoint,
    endInfo.endpoint,
    ...middlePoints,
  ];

  if (!isCovered) {
    allPoints.push(
      ...(startInfo.boundaryBox ?? []),
      ...(endInfo.boundaryBox ?? [])
    );
  }

  return {
    isIntersected,
    isCovered,
    startInfo,
    endInfo,
    allPoints: uniquePoints(getIntersectPoints(allPoints)),
    waypoint,
  };
}

export function createRoute(
  start: {
    box?: number[][];
    origin: number[];
    direction: Direction;
  },
  end: {
    box?: number[][];
    origin: number[];
    direction: Direction;
  },
  minDist: number
) {
  const { isCovered, isIntersected, startInfo, endInfo, allPoints, waypoint } =
    getPathFindingData(start, end, minDist);

  const checkedBoxs = [
    startInfo.boundaryBox && extendBox(startInfo.boundaryBox, -1),
    endInfo.boundaryBox && extendBox(endInfo.boundaryBox, -1),
  ].filter(Boolean) as number[][][];

  const checkedInnerBoxs = [startInfo.box, endInfo.box].filter(
    Boolean
  ) as number[][][];

  // If two boxes intersect and they are not covered and their directions are opposite,
  // then limit the path
  const costFactor = isIntersected
    ? !isCovered &&
      isOppositeDirection([startInfo.direction, endInfo.direction])
      ? 2
      : 0
    : 5;
  const shouldCheck = checkedBoxs.length === 2 ? !isIntersected : !isCovered;

  const grid = new Grid(allPoints, {
    getCost(p, basic) {
      const t = [0, 1].reduce((total, index) => {
        // The cost of walking inside is higher
        if (checkedInnerBoxs[index] && inView(p, checkedInnerBoxs[index])) {
          return total + 2;
        }

        if (checkedBoxs[index] && inView(p, checkedBoxs[index])) {
          return total + 1;
        }

        return total;
      }, 0);

      return basic + t * costFactor;
    },
    getWalkable(current: number[], next: number[]) {
      if (shouldCheck) {
        return checkedBoxs.every(
          item => !lineRectIntersected(current, next, item)
        );
      }

      return true;
    },
  });

  const result = find(grid, {
    startInfo,
    endInfo,
    isCovered,
    waypoint: isOppositeDirection([startInfo.direction, endInfo.direction])
      ? waypoint
      : undefined,
    waypointWalkableGetter: (from, to) => {
      if (isCovered) return true;

      return checkedBoxs.every(item => !lineRectIntersected(from, to, item));
    },
  });

  return {
    path: result,
    points: result.grid.points,
    boxs: [
      {
        fill: 'red',
        box: startInfo.boundaryBox,
      },
      {
        fill: 'green',
        box: endInfo.boundaryBox,
      },
    ],
  };
}
