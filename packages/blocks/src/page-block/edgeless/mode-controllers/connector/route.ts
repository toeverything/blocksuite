import { find } from './find.js';
import {
  getMidPoint,
  lineRectIntersected,
  rectRectIntersected,
} from './geometry-utils.js';
import { Grid } from './grid.js';
import {
  extendBox,
  getBoxConstraints,
  getIntersectPoints,
  inView,
  isOppositeDirection,
  uniquePoints,
} from './layout-utils.js';
import type { RouteEndpoint } from './types.js';

function getPathFindingData(
  start: RouteEndpoint,
  end: RouteEndpoint,
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
  const [startConstraint, endConstraint] = getBoxConstraints(
    start,
    end,
    minDist,
    isCovered
  );

  const midPoint = getMidPoint(
    startConstraint.endpoint,
    endConstraint.endpoint
  );
  const middlePoints = [
    [startConstraint.endpoint[0], midPoint[1]],
    [endConstraint.endpoint[0], midPoint[1]],
    [midPoint[0], startConstraint.endpoint[1]],
    [midPoint[0], endConstraint.endpoint[1]],
    midPoint,
  ];

  const waypoint = midPoint;
  const allPoints: number[][] = [
    startConstraint.endpoint,
    endConstraint.endpoint,
    ...middlePoints,
  ];

  if (!isCovered) {
    allPoints.push(
      ...(startConstraint.boundaryBox ?? []),
      ...(endConstraint.boundaryBox ?? [])
    );
  }

  return {
    isIntersected,
    isCovered,
    startInfo: startConstraint,
    endInfo: endConstraint,
    allPoints: uniquePoints(getIntersectPoints(allPoints)),
    waypoint,
  };
}

export function createConnectorRoute(
  start: RouteEndpoint,
  end: RouteEndpoint,
  minDist: number
) {
  const { isCovered, isIntersected, startInfo, endInfo, allPoints, waypoint } =
    getPathFindingData(start, end, minDist);

  const checkedBoxs = [
    startInfo.boundaryBox && extendBox(startInfo.boundaryBox, -1),
    endInfo.boundaryBox && extendBox(endInfo.boundaryBox, -1),
  ].filter(Boolean) as number[][][];

  const checkedInnerBoxes = [startInfo.box, endInfo.box].filter(
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
      let t = 0;
      for (let i = 0; i < 2; i++) {
        if (checkedInnerBoxes[i] && inView(p, checkedInnerBoxes[i])) {
          t += 2;
        } else if (checkedBoxs[i] && inView(p, checkedBoxs[i])) {
          t += 1;
        }
      }

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
    path: result.path,
    points: result.grid.points,
    boxes: [
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
