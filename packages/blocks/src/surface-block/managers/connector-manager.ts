import type { IVec, IVec3 } from '@blocksuite/global/utils';
import type { IBound } from '@blocksuite/global/utils';

import { Vec } from '@blocksuite/global/utils';
import { Bound } from '@blocksuite/global/utils';
import { PointLocation } from '@blocksuite/global/utils';
import {
  assertEquals,
  assertExists,
  assertType,
} from '@blocksuite/global/utils';

import type { Connectable } from '../../_common/types.js';
import type { EdgelessRootService } from '../../root-block/edgeless/edgeless-root-service.js';
import type {
  Connection,
  ConnectorElementModel,
  LocalConnectorElementModel,
} from '../element-model/connector.js';

import { last } from '../../_common/utils/iterable.js';
import { Overlay } from '../canvas-renderer/renderer.js';
import {
  ConnectorMode,
  isConnectorWithLabel,
} from '../element-model/connector.js';
import { GroupElementModel } from '../element-model/group.js';
import { AStarRunner } from '../utils/a-star.js';
import { getBoundFromPoints } from '../utils/bound.js';
import {
  getBezierCurveBoundingBox,
  getBezierParameters,
} from '../utils/curve.js';
import {
  PI2,
  almostEqual,
  clamp,
  getBoundsWithRotation,
  getPointFromBoundsWithRotation,
  isOverlap,
  isVecZero,
  lineIntersects,
  sign,
  toRadian,
} from '../utils/math-utils.js';

export type OrthogonalConnectorInput = {
  startBound: Bound | null;
  endBound: Bound | null;
  startPoint: PointLocation;
  endPoint: PointLocation;
};

export const ConnectorEndpointLocations: IVec[] = [
  // At top
  [0.5, 0],
  // At right
  [1, 0.5],
  // At bottom
  [0.5, 1],
  // At left
  [0, 0.5],
];

export const ConnectorEndpointLocationsOnTriangle: IVec[] = [
  // At top
  [0.5, 0],
  // At right
  [0.75, 0.5],
  // At bottom
  [0.5, 1],
  // At left
  [0.25, 0.5],
];

export function calculateNearestLocation(
  point: IVec,
  bounds: IBound,
  locations = ConnectorEndpointLocations,
  shortestDistance = Number.POSITIVE_INFINITY
) {
  const { x, y, w, h } = bounds;
  return locations
    .map(offset => [x + offset[0] * w, y + offset[1] * h] as IVec)
    .map(point => getPointFromBoundsWithRotation(bounds, point))
    .reduce(
      (prev, curr, index) => {
        const d = Vec.dist(point, curr);
        if (d < shortestDistance) {
          const location = locations[index];
          shortestDistance = d;
          prev[0] = location[0];
          prev[1] = location[1];
        }
        return prev;
      },
      [...locations[0]]
    ) as IVec;
}

function rBound(ele: BlockSuite.EdgelessModel, anti = false): IBound {
  const bound = Bound.deserialize(ele.xywh);
  return { ...bound, rotate: anti ? -ele.rotate : ele.rotate };
}

export function isConnectorAndBindingsAllSelected(
  connector: ConnectorElementModel | LocalConnectorElementModel,
  selected: BlockSuite.EdgelessModel[]
) {
  const connectorSelected = selected.find(s => s.id === connector.id);
  if (!connectorSelected) {
    return false;
  }
  const { source, target } = connector;
  const startSelected = selected.find(s => s.id === source?.id);
  const endSelected = selected.find(s => s.id === target?.id);
  if (!source.id && !target.id) {
    return true;
  }
  if (!source.id && endSelected) {
    return true;
  }
  if (!target.id && startSelected) {
    return true;
  }
  if (startSelected && endSelected) {
    return true;
  }
  return false;
}

export function getAnchors(ele: BlockSuite.EdgelessModel) {
  const bound = Bound.deserialize(ele.xywh);
  const offset = 10;
  const anchors: { point: PointLocation; coord: IVec }[] = [];
  const rotate = ele.rotate;

  [
    [bound.center[0], bound.y - offset],
    [bound.center[0], bound.maxY + offset],
    [bound.x - offset, bound.center[1]],
    [bound.maxX + offset, bound.center[1]],
  ]
    .map(vec =>
      getPointFromBoundsWithRotation({ ...bound, rotate }, vec as IVec)
    )
    .forEach(vec => {
      const rst = ele.getLineIntersections(bound.center as IVec, vec as IVec);
      assertExists(rst);
      const originPoint = getPointFromBoundsWithRotation(
        { ...bound, rotate: -rotate },
        rst[0]
      );
      anchors.push({ point: rst[0], coord: bound.toRelative(originPoint) });
    });
  return anchors;
}

function getConnectableRelativePosition(
  connectable: BlockSuite.EdgelessModel,
  position: IVec
) {
  const location = connectable.getRelativePointLocation(position as IVec);
  if (isVecZero(Vec.sub(position, [0, 0.5])))
    location.tangent = Vec.rot([0, -1], toRadian(connectable.rotate));
  else if (isVecZero(Vec.sub(position, [1, 0.5])))
    location.tangent = Vec.rot([0, 1], toRadian(connectable.rotate));
  else if (isVecZero(Vec.sub(position, [0.5, 0])))
    location.tangent = Vec.rot([1, 0], toRadian(connectable.rotate));
  else if (isVecZero(Vec.sub(position, [0.5, 1])))
    location.tangent = Vec.rot([-1, 0], toRadian(connectable.rotate));
  return location;
}

export function getNearestConnectableAnchor(ele: Connectable, point: IVec) {
  const anchors = getAnchors(ele);
  return closestPoint(
    anchors.map(a => a.point),
    point
  );
}

function closestPoint(points: PointLocation[], point: IVec) {
  const rst = points.map(p => ({ p, d: Vec.dist(p, point) }));
  rst.sort((a, b) => a.d - b.d);
  return rst[0].p;
}

function computePoints(
  startPoint: IVec,
  endPoint: IVec,
  nextStartPoint: IVec,
  lastEndPoint: IVec,
  startBound: Bound | null,
  endBound: Bound | null,
  expandStartBound: Bound | null,
  expandEndBound: Bound | null
): [IVec3[], IVec3, IVec3, IVec3, IVec3] {
  const startPointVec3 = downscalePrecision(startPoint);
  const endPointVec3 = downscalePrecision(endPoint);
  let nextStartPointVec3 = downscalePrecision(nextStartPoint);
  let lastEndPointVec3 = downscalePrecision(lastEndPoint);

  const result = getConnectablePoints(
    startPointVec3,
    endPointVec3,
    nextStartPointVec3,
    lastEndPointVec3,
    startBound,
    endBound,
    expandStartBound,
    expandEndBound
  );
  const points = result.points;
  nextStartPointVec3 = result.nextStartPoint;
  lastEndPointVec3 = result.lastEndPoint;
  const finalPoints = filterConnectablePoints(
    filterConnectablePoints(points, expandStartBound?.expand(-1) ?? null),
    expandEndBound?.expand(-1) ?? null
  );
  return [
    finalPoints,
    startPointVec3,
    endPointVec3,
    nextStartPointVec3,
    lastEndPointVec3,
  ];
}

function downscalePrecision(point: IVec | IVec3): IVec3 {
  return [
    Number(point[0].toFixed(2)),
    Number(point[1].toFixed(2)),
    point[2] ?? 0,
  ];
}

function filterConnectablePoints<T extends IVec3 | IVec>(
  points: T[],
  bound: Bound | null
): T[] {
  return points.filter(point => {
    if (!bound) return true;
    return !bound.isPointInBound(point as IVec);
  });
}

function pushWithPriority(points: number[][], vecs: IVec[], priority = 0) {
  points.push(...vecs.map(vec => [...vec, priority]));
}

function pushLineIntersectsToPoints(
  points: IVec3[],
  aLine: IVec[],
  bLine: IVec[],
  priority = 0
) {
  const rst = lineIntersects(aLine[0], aLine[1], bLine[0], bLine[1], true);
  if (rst) {
    pushWithPriority(points, [rst], priority);
  }
}

function pushOuterPoints(
  points: IVec3[],
  expandStartBound: Bound,
  expandEndBound: Bound,
  outerBound: Bound
) {
  if (expandStartBound && expandEndBound && outerBound) {
    pushWithPriority(points, outerBound.getVerticesAndMidpoints());
    pushWithPriority(points, [outerBound.center], 2);
    [
      expandStartBound.upperLine,
      expandStartBound.horizontalLine,
      expandStartBound.lowerLine,
      expandEndBound.upperLine,
      expandEndBound.horizontalLine,
      expandEndBound.lowerLine,
    ].forEach(line => {
      pushLineIntersectsToPoints(points, line, outerBound.leftLine, 0);
      pushLineIntersectsToPoints(points, line, outerBound.rightLine, 0);
    });
    [
      expandStartBound.leftLine,
      expandStartBound.verticalLine,
      expandStartBound.rightLine,
      expandEndBound.leftLine,
      expandEndBound.verticalLine,
      expandEndBound.rightLine,
    ].forEach(line => {
      pushLineIntersectsToPoints(points, line, outerBound.upperLine, 0);
      pushLineIntersectsToPoints(points, line, outerBound.lowerLine, 0);
    });
  }
}

function pushBoundMidPoint(
  points: IVec3[],
  bound1: Bound,
  bound2: Bound,
  expandBound1: Bound,
  expandBound2: Bound
) {
  if (bound1.maxX < bound2.x) {
    const midX = (bound1.maxX + bound2.x) / 2;
    [
      expandBound1.horizontalLine,
      expandBound2.horizontalLine,
      expandBound1.upperLine,
      expandBound1.lowerLine,
      expandBound2.upperLine,
      expandBound2.lowerLine,
    ].forEach((line, index) => {
      pushLineIntersectsToPoints(
        points,
        line,
        [
          [midX, 0],
          [midX, 1],
        ],
        index === 0 || index === 1 ? 6 : 3
      );
    });
  }
  if (bound1.maxY < bound2.y) {
    const midY = (bound1.maxY + bound2.y) / 2;
    [
      expandBound1.verticalLine,
      expandBound2.verticalLine,
      expandBound1.leftLine,
      expandBound1.rightLine,
      expandBound2.leftLine,
      expandBound2.rightLine,
    ].forEach((line, index) => {
      pushLineIntersectsToPoints(
        points,
        line,
        [
          [0, midY],
          [1, midY],
        ],
        index === 0 || index === 1 ? 6 : 3
      );
    });
  }
}

function pushGapMidPoint(
  points: IVec3[],
  point: IVec3,
  bound: Bound,
  bound2: Bound,
  expandBound: Bound,
  expandBound2: Bound
) {
  /** on top or on bottom */
  if (
    almostEqual(point[1], bound.y, 0.02) ||
    almostEqual(point[1], bound.maxY, 0.02)
  ) {
    const rst = [
      bound.upperLine,
      bound.lowerLine,
      bound2.upperLine,
      bound2.lowerLine,
    ].map(line => {
      return lineIntersects(
        point as unknown as IVec,
        [point[0], point[1] + 1],
        line[0],
        line[1],
        true
      ) as IVec;
    });
    rst.sort((a, b) => a[1] - b[1]);
    const midPoint = Vec.lrp(rst[1], rst[2], 0.5);
    pushWithPriority(points, [midPoint], 6);
    [
      expandBound.leftLine,
      expandBound.rightLine,
      expandBound2.leftLine,
      expandBound2.rightLine,
    ].forEach(line => {
      pushLineIntersectsToPoints(
        points,
        [midPoint, [midPoint[0] + 1, midPoint[1]]],
        line,
        0
      );
    });
  } else {
    const rst = [
      bound.leftLine,
      bound.rightLine,
      bound2.leftLine,
      bound2.rightLine,
    ].map(line => {
      return lineIntersects(
        point as unknown as IVec,
        [point[0] + 1, point[1]],
        line[0],
        line[1],
        true
      ) as IVec;
    });
    rst.sort((a, b) => a[0] - b[0]);
    const midPoint = Vec.lrp(rst[1], rst[2], 0.5);
    pushWithPriority(points, [midPoint], 6);
    [
      expandBound.upperLine,
      expandBound.lowerLine,
      expandBound2.upperLine,
      expandBound2.lowerLine,
    ].forEach(line => {
      pushLineIntersectsToPoints(
        points,
        [midPoint, [midPoint[0], midPoint[1] + 1]],
        line,
        0
      );
    });
  }
}

function removeDulicatePoints(points: IVec[] | IVec3[]) {
  points = points.map(downscalePrecision);
  points.sort((a, b) => a[0] - b[0]);
  assertType<IVec3[]>(points);
  for (let i = 1; i < points.length - 1; i++) {
    const cur = points[i];
    const last = points[i - 1];
    if (almostEqual(cur[0], last[0], 0.02)) {
      cur[0] = last[0];
    }
  }
  points.sort((a, b) => a[1] - b[1]);
  for (let i = 1; i < points.length - 1; i++) {
    const cur = points[i];
    const last = points[i - 1];
    if (almostEqual(cur[1], last[1], 0.02)) {
      cur[1] = last[1];
    }
  }
  points.sort((a, b) => {
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    if (a[1] < b[1]) return -1;
    if (a[1] > b[1]) return 1;
    return 0;
  });
  for (let i = 1; i < points.length; i++) {
    const cur = points[i];
    const last = points[i - 1];
    if (
      almostEqual(cur[0], last[0], 0.02) &&
      almostEqual(cur[1], last[1], 0.02)
    ) {
      if (cur[2] <= last[2]) points.splice(i, 1);
      else points.splice(i - 1, 1);
      i--;
      continue;
    }
  }
  return points;
}

function getConnectablePoints(
  startPoint: IVec3,
  endPoint: IVec3,
  nextStartPoint: IVec3,
  lastEndPoint: IVec3,
  startBound: Bound | null,
  endBound: Bound | null,
  expandStartBound: Bound | null,
  expandEndBound: Bound | null
) {
  const lineBound = Bound.fromPoints([
    startPoint,
    endPoint,
  ] as unknown[] as IVec[]);
  const outerBound =
    expandStartBound &&
    expandEndBound &&
    expandStartBound.unite(expandEndBound);
  let points = [nextStartPoint, lastEndPoint] as IVec3[];
  pushWithPriority(points, lineBound.getVerticesAndMidpoints());

  if (!startBound || !endBound) {
    pushWithPriority(points, [lineBound.center], 3);
  }
  if (outerBound) {
    pushOuterPoints(points, expandStartBound, expandEndBound, outerBound);
  }

  if (startBound && endBound) {
    assertExists(expandStartBound);
    assertExists(expandEndBound);
    pushGapMidPoint(
      points,
      startPoint,
      startBound,
      endBound,
      expandStartBound,
      expandEndBound
    );
    pushGapMidPoint(
      points,
      endPoint,
      endBound,
      startBound,
      expandEndBound,
      expandStartBound
    );
    pushBoundMidPoint(
      points,
      startBound,
      endBound,
      expandStartBound,
      expandEndBound
    );
    pushBoundMidPoint(
      points,
      endBound,
      startBound,
      expandEndBound,
      expandStartBound
    );
  }

  if (expandStartBound) {
    pushWithPriority(points, expandStartBound.getVerticesAndMidpoints());
    pushWithPriority(
      points,
      expandStartBound.include(lastEndPoint as unknown as IVec).points
    );
  }

  if (expandEndBound) {
    pushWithPriority(points, expandEndBound.getVerticesAndMidpoints());
    pushWithPriority(
      points,
      expandEndBound.include(nextStartPoint as unknown as IVec).points
    );
  }

  points = removeDulicatePoints(points);

  const sorted = points.map(point => point[0] + ',' + point[1]).sort();
  sorted.forEach((cur, index) => {
    if (index === 0) return;
    if (cur === sorted[index - 1]) {
      throw new Error('duplicate point');
    }
  });
  const startEnds = [nextStartPoint, lastEndPoint].map(point => {
    return points.find(
      item =>
        almostEqual(item[0], point[0], 0.02) &&
        almostEqual(item[1], point[1], 0.02)
    );
  }) as IVec3[];
  assertExists(startEnds[0]);
  assertExists(startEnds[1]);
  return { points, nextStartPoint: startEnds[0], lastEndPoint: startEnds[1] };
}

function getDirectPath(startPoint: IVec, endPoint: IVec): IVec[] {
  if (
    almostEqual(startPoint[0], endPoint[0], 0.02) ||
    almostEqual(startPoint[1], endPoint[1], 0.02)
  ) {
    return [startPoint, endPoint];
  } else {
    const vec = Vec.sub(endPoint, startPoint);
    const mid: IVec = [startPoint[0], startPoint[1] + vec[1]];
    return [startPoint, mid, endPoint];
  }
}

function mergePath(points: IVec[] | IVec3[]) {
  if (points.length === 0) return [];
  const result: IVec[] = [[points[0][0], points[0][1]]];
  for (let i = 1; i < points.length - 1; i++) {
    const cur = points[i];
    const last = points[i - 1];
    const next = points[i + 1];
    if (
      almostEqual(last[0], cur[0], 0.02) &&
      almostEqual(cur[0], next[0], 0.02)
    )
      continue;
    if (
      almostEqual(last[1], cur[1], 0.02) &&
      almostEqual(cur[1], next[1], 0.02)
    )
      continue;
    result.push([cur[0], cur[1]]);
  }
  result.push(last(points) as IVec);
  for (let i = 0; i < result.length - 1; i++) {
    const cur = result[i];
    const next = result[i + 1];
    try {
      assertEquals(
        almostEqual(cur[0], next[0], 0.02) ||
          almostEqual(cur[1], next[1], 0.02),
        true
      );
    } catch (_) {
      console.warn(points);
      console.warn(result);
    }
  }
  return result;
}

function computeOffset(startBound: Bound | null, endBound: Bound | null) {
  const startOffset = [20, 20, 20, 20];
  const endOffset = [20, 20, 20, 20];
  if (!(startBound && endBound)) {
    return [startOffset, endOffset];
  }
  // left, top, right, bottom
  let overlap = isOverlap(startBound.upperLine, endBound.lowerLine, 0, false);
  let dist: number;
  if (overlap && startBound.upperLine[0][1] > endBound.lowerLine[0][1]) {
    dist = Vec.distanceToLineSegment(
      startBound.upperLine[0],
      startBound.upperLine[1],
      endBound.lowerLine[0],
      false
    );
    startOffset[1] = Math.max(Math.min(dist / 2, startOffset[1]), 0);
  }

  overlap = isOverlap(startBound.rightLine, endBound.leftLine, 1, false);
  if (overlap && startBound.rightLine[0][0] < endBound.leftLine[0][0]) {
    dist = Vec.distanceToLineSegment(
      startBound.rightLine[0],
      startBound.rightLine[1],
      endBound.leftLine[0],
      false
    );
    startOffset[2] = Math.max(Math.min(dist / 2, startOffset[2]), 0);
  }

  overlap = isOverlap(startBound.lowerLine, endBound.upperLine, 0, false);
  if (overlap && startBound.lowerLine[0][1] < endBound.upperLine[0][1]) {
    dist = Vec.distanceToLineSegment(
      startBound.lowerLine[0],
      startBound.lowerLine[1],
      endBound.upperLine[0],
      false
    );
    startOffset[3] = Math.max(Math.min(dist / 2, startOffset[3]), 0);
  }

  startOffset[0] = endOffset[2] =
    Math.min(startOffset[0], endOffset[2]) === 0
      ? 20
      : Math.min(startOffset[0], endOffset[2]);
  startOffset[1] = endOffset[3] =
    Math.min(startOffset[1], endOffset[3]) === 0
      ? 20
      : Math.min(startOffset[1], endOffset[3]);
  startOffset[2] = endOffset[0] =
    Math.min(startOffset[2], endOffset[0]) === 0
      ? 20
      : Math.min(startOffset[2], endOffset[0]);
  startOffset[3] = endOffset[1] =
    Math.min(startOffset[3], endOffset[1]) === 0
      ? 20
      : Math.min(startOffset[3], endOffset[1]);

  return [startOffset, endOffset];
}

function getNextPoint(
  bound: Bound,
  point: PointLocation,
  offsetX = 10,
  offsetY = 10,
  offsetW = 10,
  offsetH = 10
) {
  const result: IVec = Array.from(point) as IVec;
  if (almostEqual(bound.x, result[0])) result[0] -= offsetX;
  else if (almostEqual(bound.y, result[1])) result[1] -= offsetY;
  else if (almostEqual(bound.maxX, result[0])) result[0] += offsetW;
  else if (almostEqual(bound.maxY, result[1])) result[1] += offsetH;
  else {
    const direction = Vec.normalize(Vec.sub(result, bound.center));
    const xDirection = direction[0] > 0 ? 1 : -1;
    const yDirection = direction[1] > 0 ? 1 : -1;

    const slope =
      Math.abs(point.tangent[0]) < Math.abs(point.tangent[1]) ? 0 : 1;
    // if the slope is big, use the x direction
    if (slope === 0) {
      if (xDirection > 0) {
        const intersects = lineIntersects(
          bound.rightLine[0],
          bound.rightLine[1],
          result,
          [bound.maxX + 10, result[1]]
        );
        assertExists(intersects);
        result[0] = intersects[0] + offsetX;
      } else {
        const intersects = lineIntersects(
          bound.leftLine[0],
          bound.leftLine[1],
          result,
          [bound.x - 10, result[1]]
        );
        assertExists(intersects);
        result[0] = intersects[0] - offsetX;
      }
    } else {
      if (yDirection > 0) {
        const intersects = lineIntersects(
          bound.lowerLine[0],
          bound.lowerLine[1],
          result,
          [result[0], bound.maxY + 10]
        );
        assertExists(intersects);
        result[1] = intersects[1] + offsetY;
      } else {
        const intersects = lineIntersects(
          bound.upperLine[0],
          bound.upperLine[1],
          result,
          [result[0], bound.y - 10]
        );
        assertExists(intersects);
        result[1] = intersects[1] - offsetY;
      }
    }
  }
  return result;
}

function computeNextStartEndpoint(
  startPoint: PointLocation,
  endPoint: PointLocation,
  startBound: Bound | null,
  endBound: Bound | null,
  startOffset: number[] | null,
  endOffset: number[] | null
) {
  const nextStartPoint =
    startBound && startOffset
      ? getNextPoint(
          startBound,
          startPoint,
          startOffset[0],
          startOffset[1],
          startOffset[2],
          startOffset[3]
        )
      : startPoint;
  const lastEndPoint =
    endBound && endOffset
      ? getNextPoint(
          endBound,
          endPoint,
          endOffset[0],
          endOffset[1],
          endOffset[2],
          endOffset[3]
        )
      : endPoint;
  return [nextStartPoint, lastEndPoint];
}

function adjustStartEndPoint(
  startPoint: IVec3,
  endPoint: IVec3,
  startBound: Bound | null = null,
  endBound: Bound | null = null
) {
  if (!endBound) {
    if (
      Math.abs(endPoint[0] - startPoint[0]) >
      Math.abs(endPoint[1] - startPoint[1])
    ) {
      endPoint[0] += sign(endPoint[0] - startPoint[0]) * 20;
    } else {
      endPoint[1] += sign(endPoint[1] - startPoint[1]) * 20;
    }
  }
  if (!startBound) {
    if (
      Math.abs(endPoint[0] - startPoint[0]) >
      Math.abs(endPoint[1] - startPoint[1])
    ) {
      startPoint[0] -= sign(endPoint[0] - startPoint[0]) * 20;
    } else {
      startPoint[1] -= sign(endPoint[1] - startPoint[1]) * 20;
    }
  }
}

function renderRect(
  ctx: CanvasRenderingContext2D,
  bounds: IBound,
  color: string,
  lineWidth: number
) {
  const { x, y, w, h } = bounds;
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([lineWidth * 2, lineWidth * 2]);
  ctx.strokeRect(x, y, w, h);
  ctx.closePath();
  ctx.restore();
}

export class ConnectionOverlay extends Overlay {
  highlightPoint: IVec | null = null;

  points: IVec[] = [];

  sourceBounds: IBound | null = null;

  targetBounds: IBound | null = null;

  constructor(private _service: EdgelessRootService) {
    super();
  }

  _clearRect() {
    this.points = [];
    this.highlightPoint = null;
    this._renderer.refresh();
  }

  private _findConnectablesInViews() {
    const service = this._service;
    const bound = this._service.viewport.viewportBounds;
    return service.pickElementsByBound(bound).filter(ele => ele.connectable);
  }

  clear() {
    this.sourceBounds = null;
    this.targetBounds = null;
    this._clearRect();
  }

  override render(ctx: CanvasRenderingContext2D): void {
    const zoom = this._service.viewport.zoom;
    const radius = 5 / zoom;
    const color = getComputedStyle(this._service.host).getPropertyValue(
      '--affine-text-emphasis-color'
    );

    ctx.globalAlpha = 0.6;
    let lineWidth = 1 / zoom;
    if (this.sourceBounds) {
      renderRect(ctx, this.sourceBounds, color, lineWidth);
    }
    if (this.targetBounds) {
      renderRect(ctx, this.targetBounds, color, lineWidth);
    }

    lineWidth = 2 / zoom;
    this.points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], radius, 0, PI2);
      ctx.fillStyle = 'white';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    });

    ctx.globalAlpha = 1;
    if (this.highlightPoint) {
      ctx.beginPath();
      ctx.arc(this.highlightPoint[0], this.highlightPoint[1], radius, 0, PI2);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    }
  }

  /**
   * Render the connector at the given point. It will try to find
   * the closest connectable element and render the connector. If the
   * point is not close to any connectable element, it will just render
   * the connector at the given point.
   * @param point the point to render the connector
   * @param excludedIds the ids of the elements that should be excluded
   * @returns the connection result
   */
  renderConnector(point: IVec, excludedIds: string[] = []) {
    const connectables = this._findConnectablesInViews();
    const service = this._service;
    let target;

    this._clearRect();

    let result: Connection | null = null;
    for (let i = 0; i < connectables.length; i++) {
      const connectable = connectables[i];
      // first check if in excluedIds
      if (excludedIds.includes(connectable.id)) continue;

      // then check if in expanded bound
      const bound = Bound.deserialize(connectable.xywh);
      const rotateBound = Bound.from(
        getBoundsWithRotation(rBound(connectable))
      );
      // FIXME: the real path needs to be expanded: diamod, ellipse, trangle.
      if (!rotateBound.expand(10).isPointInBound(point)) continue;

      // then check if closes to anchors
      const anchors = getAnchors(connectable);
      const len = anchors.length;
      const pointerViewCoord = service.viewport.toViewCoord(point[0], point[1]);

      let shortestDistance = Number.POSITIVE_INFINITY;
      let j = 0;

      this.points = anchors.map(a => a.point);

      for (; j < len; j++) {
        const anchor = anchors[j];
        const anchorViewCoord = service.viewport.toViewCoord(
          anchor.point[0],
          anchor.point[1]
        );
        const d = Vec.dist(anchorViewCoord, pointerViewCoord);
        if (d < shortestDistance) {
          shortestDistance = d;
          target = connectable;
          this.highlightPoint = anchor.point;
          result = {
            id: connectable.id,
            position: anchor.coord as IVec,
          };
        }
      }

      if (shortestDistance < 8 && result) break;

      // if not, check if closes to bound
      const nearestPoint = connectable.getNearestPoint(point as IVec) as IVec;

      if (Vec.dist(nearestPoint, point) < 8) {
        this.highlightPoint = nearestPoint;
        const originPoint = getPointFromBoundsWithRotation(
          rBound(connectable, true),
          nearestPoint
        );
        this._renderer.refresh();
        target = connectable;
        result = {
          id: connectable.id,
          position: bound
            .toRelative(originPoint)
            .map(n => clamp(n, 0, 1)) as IVec,
        };
      }

      if (result) break;

      // if not, check if in inside of the element
      if (
        connectable.includesPoint(
          point[0],
          point[1],
          {
            ignoreTransparent: false,
          },
          this._service.host
        )
      ) {
        target = connectable;
        result = {
          id: connectable.id,
        };
      }
    }

    if (target instanceof GroupElementModel) {
      this.targetBounds = Bound.deserialize(target.xywh);
    } else {
      this.targetBounds = null;
    }

    // at last, if not, just return the point
    if (!result) {
      result = {
        position: point as IVec,
      };
    }

    this._renderer.refresh();

    return result;
  }
}

export class ConnectorPathGenerator {
  protected _aStarRunner: AStarRunner | null = null;

  constructor(
    private options: {
      getElementById: (id: string) => BlockSuite.EdgelessModel | null;
    }
  ) {}

  private _computeStartEndPoint(
    connector: ConnectorElementModel | LocalConnectorElementModel
  ) {
    const { source, target } = connector;
    const start = this._getConnectorEndElement(connector, 'source');
    const end = this._getConnectorEndElement(connector, 'target');

    let startPoint: PointLocation, endPoint: PointLocation;
    if (source.id && !source.position && target.id && !target.position) {
      assertExists(start);
      assertExists(end);
      const startAnchors = getAnchors(start);
      const endAnchors = getAnchors(end);
      let minDist = Infinity;
      let minStartAnchor = new PointLocation();
      let minEndAnchor = new PointLocation();
      for (const sa of startAnchors) {
        for (const ea of endAnchors) {
          const dist = Vec.dist(sa.point, ea.point);
          if (dist + 0.1 < minDist) {
            minDist = dist;
            minStartAnchor = sa.point;
            minEndAnchor = ea.point;
          }
        }
      }
      startPoint = minStartAnchor;
      endPoint = minEndAnchor;
    } else {
      startPoint = this._getConnectionPoint(connector, 'source');
      endPoint = this._getConnectionPoint(connector, 'target');
    }
    return [startPoint, endPoint];
  }

  private _generateConnectorPath(
    connector: ConnectorElementModel | LocalConnectorElementModel
  ) {
    const { mode } = connector;
    if (mode === ConnectorMode.Straight) {
      return this._generateStraightConnectorPath(connector);
    } else if (mode === ConnectorMode.Orthogonal) {
      const start = this._getConnectorEndElement(connector, 'source');
      const end = this._getConnectorEndElement(connector, 'target');

      const [startPoint, endPoint] = this._computeStartEndPoint(connector);

      const startBound = start
        ? Bound.from(getBoundsWithRotation(rBound(start)))
        : null;
      const endBound = end
        ? Bound.from(getBoundsWithRotation(rBound(end)))
        : null;
      const path = this.generateOrthogonalConnectorPath({
        startPoint,
        endPoint,
        startBound,
        endBound,
      });
      return path.map(p => new PointLocation(p));
    } else if (mode === ConnectorMode.Curve) {
      return this._generateCurveConnectorPath(connector);
    }
    throw new Error('unknown connector mode');
  }

  private _generateCurveConnectorPath(
    connector: ConnectorElementModel | LocalConnectorElementModel
  ) {
    const { source, target } = connector;

    if (source.id || target.id) {
      let startPoint: PointLocation;
      let endPoint: PointLocation;
      if (!source.position && !target.position) {
        const start = this._getConnectorEndElement(
          connector,
          'source'
        ) as Connectable;
        const end = this._getConnectorEndElement(
          connector,
          'target'
        ) as Connectable;
        const sb = Bound.deserialize(start.xywh);
        const eb = Bound.deserialize(end.xywh);
        startPoint = getNearestConnectableAnchor(start, eb.center);
        endPoint = getNearestConnectableAnchor(end, sb.center);
      } else {
        startPoint = this._getConnectionPoint(connector, 'source');
        endPoint = this._getConnectionPoint(connector, 'target');
      }

      if (source.id) {
        const startTangentVertical = Vec.rot(startPoint.tangent, -Math.PI / 2);
        startPoint.out = Vec.mul(
          startTangentVertical,
          Math.max(
            100,
            Math.abs(
              Vec.pry(Vec.sub(endPoint, startPoint), startTangentVertical)
            ) / 3
          )
        );
      }
      if (target.id) {
        const endTangentVertical = Vec.rot(endPoint.tangent, -Math.PI / 2);
        endPoint.in = Vec.mul(
          endTangentVertical,
          Math.max(
            100,
            Math.abs(
              Vec.pry(Vec.sub(startPoint, endPoint), endTangentVertical)
            ) / 3
          )
        );
      }
      return [startPoint, endPoint];
    } else {
      const endPoint = this._getConnectionPoint(connector, 'target');
      const startPoint = this._getConnectionPoint(connector, 'source');
      if (
        Math.abs(endPoint[0] - startPoint[0]) >
        Math.abs(endPoint[1] - startPoint[1])
      ) {
        startPoint.out = [Vec.mul(Vec.sub(endPoint, startPoint), 2 / 3)[0], 0];
        endPoint.in = [Vec.mul(Vec.sub(startPoint, endPoint), 2 / 3)[0], 0];
      } else {
        startPoint.out = [0, Vec.mul(Vec.sub(endPoint, startPoint), 2 / 3)[1]];
        endPoint.in = [0, Vec.mul(Vec.sub(startPoint, endPoint), 2 / 3)[1]];
      }
      return [startPoint, endPoint];
    }
  }

  private _generateStraightConnectorPath(
    connector: ConnectorElementModel | LocalConnectorElementModel
  ) {
    const { source, target } = connector;
    if (source.id && !source.position && target.id && !target.position) {
      const start = this._getConnectorEndElement(
        connector,
        'source'
      ) as Connectable;
      const end = this._getConnectorEndElement(
        connector,
        'target'
      ) as Connectable;
      const sb = Bound.deserialize(start.xywh);
      const eb = Bound.deserialize(end.xywh);
      const startPoint = getNearestConnectableAnchor(start, eb.center);
      const endPoint = getNearestConnectableAnchor(end, sb.center);
      return [startPoint, endPoint];
    } else {
      const endPoint = this._getConnectionPoint(connector, 'target');
      const startPoint = this._getConnectionPoint(connector, 'source');
      return (startPoint && endPoint && [startPoint, endPoint]) ?? [];
    }
  }

  private _getConnectionPoint(
    connector: ConnectorElementModel | LocalConnectorElementModel,
    type: 'source' | 'target'
  ): PointLocation {
    const connection = connector[type];
    const anotherType = type === 'source' ? 'target' : 'source';

    if (connection.id) {
      const connectable = this._getConnectorEndElement(connector, type);
      assertExists(connectable);

      if (!connection.position) {
        const otherPoint = this._getConnectionPoint(connector, anotherType);
        return getNearestConnectableAnchor(connectable, otherPoint);
      } else {
        return getConnectableRelativePosition(connectable, connection.position);
      }
    } else {
      assertExists(connection.position);
      return PointLocation.fromVec(connection.position);
    }
  }

  private _getConnectorEndElement(
    connector: ConnectorElementModel | LocalConnectorElementModel,
    type: 'source' | 'target'
  ): Connectable | null {
    const id = connector[type].id;

    if (id) {
      return this.options.getElementById(id) as Connectable;
    }

    return null;
  }

  private _prepareOrthogonalConnectorInfo(
    connectorInfo: OrthogonalConnectorInput
  ): [
    IVec,
    IVec,
    IVec,
    IVec,
    Bound | null,
    Bound | null,
    Bound | null,
    Bound | null,
  ] {
    const { startBound, endBound, startPoint, endPoint } = connectorInfo;

    const [startOffset, endOffset] = computeOffset(startBound, endBound);
    const [nextStartPoint, lastEndPoint] = computeNextStartEndpoint(
      startPoint,
      endPoint,
      startBound,
      endBound,
      startOffset,
      endOffset
    );
    const expandStartBound = startBound
      ? startBound.expand(
          startOffset[0],
          startOffset[1],
          startOffset[2],
          startOffset[3]
        )
      : null;
    const expandEndBound = endBound
      ? endBound.expand(endOffset[0], endOffset[1], endOffset[2], endOffset[3])
      : null;

    return [
      startPoint,
      endPoint,
      nextStartPoint,
      lastEndPoint,
      startBound,
      endBound,
      expandStartBound,
      expandEndBound,
    ];
  }

  generateOrthogonalConnectorPath(input: OrthogonalConnectorInput): IVec[] {
    const info = this._prepareOrthogonalConnectorInfo(input);
    const [startPoint, endPoint, nextStartPoint, lastEndPoint] = info;
    const [, , , , startBound, endBound, expandStartBound, expandEndBound] =
      info;
    const blocks = [];
    const expandBlocks = [];
    startBound && blocks.push(startBound.clone());
    endBound && blocks.push(endBound.clone());
    expandStartBound && expandBlocks.push(expandStartBound.clone());
    expandEndBound && expandBlocks.push(expandEndBound.clone());

    if (
      startBound &&
      endBound &&
      startBound.isPointInBound(endPoint) &&
      endBound.isPointInBound(startPoint)
    ) {
      return getDirectPath(startPoint, endPoint);
    }

    if (startBound && expandStartBound?.isPointInBound(endPoint, 0)) {
      return getDirectPath(startPoint, endPoint);
    }

    if (endBound && expandEndBound?.isPointInBound(startPoint, 0)) {
      return getDirectPath(startPoint, endPoint);
    }

    const points = computePoints(
      startPoint,
      endPoint,
      nextStartPoint,
      lastEndPoint,
      startBound,
      endBound,
      expandStartBound,
      expandEndBound
    );
    const finalPoints = points[0];
    const [, startPointV3, endPointV3, nextStartPointV3, lastEndPointV3] =
      points;

    adjustStartEndPoint(startPointV3, endPointV3, startBound, endBound);
    this._aStarRunner = new AStarRunner(
      finalPoints,
      nextStartPointV3,
      lastEndPointV3,
      startPointV3,
      endPointV3,
      blocks,
      expandBlocks
    );
    this._aStarRunner.run();
    const path = this._aStarRunner.path;
    if (!endBound) path.pop();
    if (!startBound) path.shift();

    return mergePath(path);
  }

  hasRelatedElement(
    connecter: ConnectorElementModel | LocalConnectorElementModel
  ) {
    const { source, target } = connecter;
    if (
      (source.id && !this.options.getElementById(source.id)) ||
      (target.id && !this.options.getElementById(target.id))
    ) {
      return false;
    }

    return true;
  }

  updatePath(
    connector: ConnectorElementModel | LocalConnectorElementModel,
    path?: PointLocation[]
  ) {
    const points = path ?? this._generateConnectorPath(connector) ?? [];
    const bound =
      connector.mode === ConnectorMode.Curve
        ? getBezierCurveBoundingBox(getBezierParameters(points))
        : getBoundFromPoints(points);
    const relativePoints = points.map((p: PointLocation) => {
      return p.setVec(Vec.sub(p, [bound.x, bound.y]));
    });

    connector.updatingPath = true;
    // the property assignment order matters
    connector.xywh = bound.serialize();
    connector.path = relativePoints;

    // Updates Connector's Label position.
    if (isConnectorWithLabel(connector)) {
      const model = connector as ConnectorElementModel;
      const [cx, cy] = model.getPointByOffsetDistance(
        model.labelOffset.distance
      );
      const [, , w, h] = model.labelXYWH!;
      model.labelXYWH = [cx - w / 2, cy - h / 2, w, h];
    }

    connector.updatingPath = false;
  }
}
