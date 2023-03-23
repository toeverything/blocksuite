import type { Direction } from './constants.js';
import { find } from './find.js';
import { getMidPoint, lineRect, rectRect } from './geometry.js';
import { Grid } from './grid0.js';
import {
  extendBox,
  getBoxConstraintsInfo,
  getIntersectPoints,
  inView,
  isOppositeDirection,
  uniqPoints,
} from './layout-util.js';

const getPathFindingData = (
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
) => {
  // 两个盒子相交
  const isIntersect =
    start.box && end.box ? rectRect(start.box, end.box) : false;
  const testBoxs = [
    [start.origin, end.box],
    [end.origin, start.box],
  ].filter(item => item[1]) as [number[], number[][]][];

  // 起始点结速点都被另外一个盒子覆盖
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
    isIntersect,
    isCovered,
    startInfo,
    endInfo,
    allPoints: uniqPoints(getIntersectPoints(allPoints)),
    waypoint,
  };
};

export const createRoute = (
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
) => {
  const { isCovered, isIntersect, startInfo, endInfo, allPoints, waypoint } =
    getPathFindingData(start, end, minDist);

  const checkedBoxs = [
    startInfo.boundaryBox && extendBox(startInfo.boundaryBox, -1),
    endInfo.boundaryBox && extendBox(endInfo.boundaryBox, -1),
  ].filter(Boolean) as number[][][];

  const checkedInnerBoxs = [startInfo.box, endInfo.box].filter(
    Boolean
  ) as number[][][];

  // 相交且不是 coverd 并且方向相对才限制路径
  const costFactor = isIntersect
    ? !isCovered &&
      isOppositeDirection([startInfo.direction, endInfo.direction])
      ? 2
      : 0
    : 5;
  const shouldCheck = checkedBoxs.length === 2 ? !isIntersect : !isCovered;

  const grid = new Grid(allPoints, {
    getCost(p, basic) {
      const t = [0, 1].reduce((total, index) => {
        // 走里面的 cost 更多
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
        return checkedBoxs.every(item => !lineRect(current, next, item));
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
    checkWaypointWalkable: (from, to) => {
      if (isCovered) {
        return true;
      }

      return checkedBoxs.every(item => !lineRect(from, to, item));
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
};
