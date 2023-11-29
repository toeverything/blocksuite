import { assertEquals, assertExists } from '@blocksuite/global/utils';

import {
  type Connectable,
  type EdgelessElement,
  type Selectable,
} from '../../_common/utils/types.js';
import type { CanvasElementType } from '../../surface-block/index.js';
import {
  almostEqual,
  AStarRunner,
  Bound,
  clamp,
  type Connection,
  type ConnectorElement,
  ConnectorMode,
  getBoundFromPoints,
  getBoundsWithRotation,
  getPointFromBoundsWithRotation,
  type IBound,
  type IConnector,
  isOverlap,
  type IVec,
  lineIntersects,
  Overlay,
  PointLocation,
  sign,
  toRadian,
  Vec,
} from '../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../surface-block/surface-block.js';
import { isVecZero } from '../../surface-block/utils/math-utils.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';

export type OrthogonalConnectorInput = {
  startBound: Bound | null;
  endBound: Bound | null;
  startPoint: PointLocation;
  endPoint: PointLocation;
};

function rBound(ele: Connectable, anti = false): IBound {
  const bound = Bound.deserialize(ele.xywh);
  return { ...bound, rotate: anti ? -ele.rotate : ele.rotate };
}

export function isConnectorAndBindingsAllSelected(
  connector: ConnectorElement,
  selected: Selectable[]
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

export function getAnchors(ele: Connectable) {
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
    .map(vec => getPointFromBoundsWithRotation({ ...bound, rotate }, vec))
    .forEach(vec => {
      const rst = ele.intersectWithLine(bound.center, vec);
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
  connectable: Connectable,
  position: IVec
) {
  const location = connectable.getRelativePointLocation(position);
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
): [IVec[], IVec, IVec, IVec, IVec] {
  startPoint = downscalePrecision(startPoint);
  endPoint = downscalePrecision(endPoint);
  nextStartPoint = downscalePrecision(nextStartPoint);
  lastEndPoint = downscalePrecision(lastEndPoint);
  const result = getConnectablePoints(
    startPoint,
    endPoint,
    nextStartPoint,
    lastEndPoint,
    startBound,
    endBound,
    expandStartBound,
    expandEndBound
  );
  const points = result.points;
  nextStartPoint = result.nextStartPoint;
  lastEndPoint = result.lastEndPoint;
  const finalPoints = filterConnectablePoints(
    filterConnectablePoints(points, expandStartBound?.expand(-1) ?? null),
    expandEndBound?.expand(-1) ?? null
  );
  return [finalPoints, startPoint, endPoint, nextStartPoint, lastEndPoint];
}

function downscalePrecision(point: IVec) {
  return [
    Number(point[0].toFixed(2)),
    Number(point[1].toFixed(2)),
    point[2] ?? 0,
  ];
}

function filterConnectablePoints(points: IVec[], bound: Bound | null) {
  return points.filter(point => {
    if (!bound) return true;
    return !bound.isPointInBound(point);
  });
}

function pushWithPriority(points: IVec[], vecs: IVec[], priority = 0) {
  points.push(...vecs.map(vec => [...vec, priority]));
}

function pushLineIntersectsToPoints(
  points: IVec[],
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
  points: IVec[],
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
  points: IVec[],
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
  points: IVec[],
  point: IVec,
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
        point,
        [point[0], point[1] + 1],
        line[0],
        line[1],
        true
      );
    }) as number[][];
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
        point,
        [point[0] + 1, point[1]],
        line[0],
        line[1],
        true
      );
    }) as number[][];
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

function removeDulicatePoints(points: IVec[]) {
  points = points.map(downscalePrecision);
  points.sort((a, b) => a[0] - b[0]);
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
  startPoint: IVec,
  endPoint: IVec,
  nextStartPoint: IVec,
  lastEndPoint: IVec,
  startBound: Bound | null,
  endBound: Bound | null,
  expandStartBound: Bound | null,
  expandEndBound: Bound | null
) {
  const lineBound = Bound.fromPoints([startPoint, endPoint]);
  const outerBound =
    expandStartBound &&
    expandEndBound &&
    expandStartBound.unite(expandEndBound);
  let points: IVec[] = [nextStartPoint, lastEndPoint];
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
    pushWithPriority(points, expandStartBound.include(lastEndPoint).points);
  }

  if (expandEndBound) {
    pushWithPriority(points, expandEndBound.getVerticesAndMidpoints());
    pushWithPriority(points, expandEndBound.include(nextStartPoint).points);
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
  }) as IVec[];
  assertExists(startEnds[0]);
  assertExists(startEnds[1]);
  return { points, nextStartPoint: startEnds[0], lastEndPoint: startEnds[1] };
}

function getDirectPath(startPoint: IVec, endPoint: IVec) {
  if (
    almostEqual(startPoint[0], endPoint[0], 0.02) ||
    almostEqual(startPoint[1], endPoint[1], 0.02)
  ) {
    return [startPoint, endPoint];
  } else {
    const vec = Vec.sub(endPoint, startPoint);
    const mid = [startPoint[0], startPoint[1] + vec[1]];
    return [startPoint, mid, endPoint];
  }
}

function mergePath(points: IVec[]) {
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
  result.push(points[points.length - 1]);
  for (let i = 0; i < result.length - 1; i++) {
    const cur = result[i];
    const next = result[i + 1];
    try {
      assertEquals(
        almostEqual(cur[0], next[0], 0.02) ||
          almostEqual(cur[1], next[1], 0.02),
        true
      );
    } catch (e) {
      console.log(points);
      console.log(result);
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
  const result: IVec = Array.from(point);
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
  startOffset: IVec | null,
  endOffset: IVec | null
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
  startPoint: IVec,
  endPoint: IVec,
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

export class ConnectionOverlay extends Overlay {
  surface!: SurfaceBlockComponent;
  points: IVec[] = [];
  highlightPoint: IVec | null = null;
  bound: Bound | null = null;

  override render(ctx: CanvasRenderingContext2D): void {
    const zoom = this.surface.viewport.zoom;
    this.points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 3 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'blue';
      ctx.fill();
      ctx.stroke();
    });
    if (this.highlightPoint) {
      ctx.beginPath();
      ctx.arc(
        this.highlightPoint[0],
        this.highlightPoint[1],
        3 / zoom,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'blue';
      ctx.strokeStyle = 'blue';
      ctx.fill();
      ctx.stroke();
    }
    if (this.bound) {
      ctx.beginPath();
      ctx.rect(this.bound.x, this.bound.y, this.bound.w, this.bound.h);
      ctx.fillStyle = 'rgba(211, 211, 211, 0.3)';
      ctx.fill();
    }
  }

  clear() {
    this.points = [];
    this.highlightPoint = null;
    this.bound = null;
  }
}

export class ConnectorPathGenerator {
  protected _aStarRunner: AStarRunner | null = null;

  constructor(
    private options: {
      pickById: (id: string) => EdgelessElement | Connectable | null;
      refresh: () => void;
    }
  ) {}

  private _getConnectorEndElement(
    connector: IConnector,
    type: 'source' | 'target'
  ): Connectable | null {
    const id = connector[type].id;

    if (id) {
      return this.options.pickById(id) as Connectable;
    }

    return null;
  }

  private _getConnectionPoint(
    connector: IConnector,
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

  private _generateStraightConnectorPath(connector: ConnectorElement) {
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

  private _computeStartEndPoint(connector: ConnectorElement) {
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

  private _generateCurveConnectorPath(connector: ConnectorElement) {
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

  private _generateConnectorPath(connector: ConnectorElement) {
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

  updatePath(connector: ConnectorElement, path?: PointLocation[]) {
    const points = path ?? this._generateConnectorPath(connector) ?? [];

    const bound = getBoundFromPoints(points);
    const relativePoints = points.map(p => {
      p.setVec(Vec.sub(p, [bound.x, bound.y]));
      return p;
    });

    connector.path = relativePoints;
    connector.xywh = bound.serialize();
    this.options.refresh();
  }

  generateOrthogonalConnectorPath(input: OrthogonalConnectorInput) {
    const info = this._prepareOrthogonalConnectorInfo(input);
    let [startPoint, endPoint, nextStartPoint, lastEndPoint] = info;
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
    [, startPoint, endPoint, nextStartPoint, lastEndPoint] = points;
    adjustStartEndPoint(startPoint, endPoint, startBound, endBound);
    this._aStarRunner = new AStarRunner(
      finalPoints,
      nextStartPoint,
      lastEndPoint,
      startPoint,
      endPoint,
      blocks,
      expandBlocks
    );
    this._aStarRunner.run();
    let path = this._aStarRunner.path;
    if (!endBound) path.pop();
    if (!startBound) path.shift();
    path = mergePath(path);
    return path;
  }

  hasRelatedElement(connecter: ConnectorElement) {
    const { source, target } = connecter;
    if (
      (source.id && !this.options.pickById(source.id)) ||
      (target.id && !this.options.pickById(target.id))
    ) {
      return false;
    }

    return true;
  }
}

export class EdgelessConnectorManager extends ConnectorPathGenerator {
  private _connectionOverlay = new ConnectionOverlay();

  constructor(private _edgeless: EdgelessPageBlockComponent) {
    super({
      pickById: (id: string) =>
        this._edgeless.surface.pickById(id) as Connectable,
      refresh: () => this._edgeless.surface.refresh(),
    });

    this._edgeless.surface.viewport.addOverlay(this._connectionOverlay);
    this._connectionOverlay.surface = this._edgeless.surface;
  }

  private _findConnectablesInViewport() {
    const { surface } = this._edgeless;
    const { viewport } = surface;
    const bound = viewport.viewportBounds;
    const candidates = [
      ...surface.viewport.gridManager.search(bound),
      ...surface.blocks,
    ];
    const picked = candidates.filter(
      element => element.boxSelect(bound) && element.connectable
    );
    return picked;
  }

  searchConnection(point: IVec, excludedIds: string[] = []) {
    const { _connectionOverlay } = this;
    const { surface } = this._edgeless;
    const connectables = this._findConnectablesInViewport();

    _connectionOverlay.clear();
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
      if (!rotateBound.expand(10).isPointInBound(point)) continue;

      // then check if closes to anchors
      const anchors = getAnchors(connectable);
      _connectionOverlay.points = anchors.map(a => a.point);
      for (let j = 0; j < anchors.length; j++) {
        const anchor = anchors[j];
        const anchorViewCoord = surface.toViewCoord(
          anchor.point[0],
          anchor.point[1]
        );
        const pointerViewCoord = surface.toViewCoord(point[0], point[1]);
        if (Vec.dist(anchorViewCoord, pointerViewCoord) < 20) {
          _connectionOverlay.highlightPoint = anchor.point;
          result = {
            id: connectable.id,
            position: anchor.coord,
          };
        }
      }
      if (result) break;

      // if not, check if closes to bound
      const nearestPoint = connectable.getNearestPoint(point);
      if (Vec.dist(nearestPoint, point) < 8) {
        _connectionOverlay.highlightPoint = nearestPoint;
        const originPoint = getPointFromBoundsWithRotation(
          rBound(connectable, true),
          nearestPoint
        );
        surface.refresh();
        result = {
          id: connectable.id,
          position: bound.toRelative(originPoint).map(n => clamp(n, 0, 1)),
        };
      }
      if (result) break;
      // if not, check if in inside of the element

      if (
        connectable.hitTest(point[0], point[1], {
          ignoreTransparent: false,
        })
      ) {
        result = {
          id: connectable.id,
        };
      }
    }

    // at last, if not, just return the point
    if (!result)
      result = {
        position: point,
      };

    surface.refresh();
    return result;
  }

  clear() {
    this._connectionOverlay.points = [];
    this._connectionOverlay.highlightPoint = null;
    this._connectionOverlay.bound = null;
    this._edgeless.surface.refresh();
  }

  updateConnection(
    connector: ConnectorElement,
    point: IVec,
    connection: 'source' | 'target'
  ) {
    const { surface } = this._edgeless;
    const id = connector.id;
    const anotherConnection = connection === 'source' ? 'target' : 'source';
    const anotherId = connector[anotherConnection]?.id;
    const result = this.searchConnection(point, anotherId ? [anotherId] : []);
    surface.updateElement<CanvasElementType.CONNECTOR>(id, {
      [connection]: result,
    });
  }

  updateXYWH(connector: ConnectorElement, bound: Bound) {
    const { surface } = this._edgeless;

    const oldBound = Bound.deserialize(connector.xywh);
    const offset = Vec.sub([bound.x, bound.y], [oldBound.x, oldBound.y]);
    const updates: Partial<IConnector> = {};

    const { source, target } = connector;
    if (!source.id && source.position)
      updates.source = { position: Vec.add(source.position, offset) };
    if (!target.id && target.position)
      updates.target = { position: Vec.add(target.position, offset) };
    updates.xywh = bound.serialize();
    surface.updateElement<CanvasElementType.CONNECTOR>(connector.id, updates);
  }

  syncConnectorPos(connected: Connectable[]) {
    const connectors = this.getConnecttedConnectors(connected);
    connectors.forEach(connector => this.updatePath(connector));
  }

  detachConnectors(connected: Connectable[]) {
    const surface = this._edgeless.surface;
    connected.forEach(ele => {
      this.getConnecttedConnectors([ele]).forEach(connector => {
        const absolutePath = connector.absolutePath;
        if (connector.source.id === ele.id) {
          surface.updateElement<CanvasElementType.CONNECTOR>(connector.id, {
            source: { position: absolutePath[0] },
          });
        } else if (connector.target.id === ele.id) {
          surface.updateElement<CanvasElementType.CONNECTOR>(connector.id, {
            target: { position: absolutePath[absolutePath.length - 1] },
          });
        }
      });
    });
  }

  getConnecttedConnectors(elements: Connectable[]) {
    const { surface } = this._edgeless;
    const ids = new Set(elements.map(e => e.id));
    const connectors = surface
      .getElements()
      .filter(e => e.type === 'connector') as ConnectorElement[];
    const result: ConnectorElement[] = [];
    connectors.forEach(connector => {
      if (
        (connector.source.id && ids.has(connector.source.id)) ||
        (connector.target.id && ids.has(connector.target.id))
      ) {
        result.push(connector);
      }
    });
    return result;
  }

  getConnecttedElements(element: Connectable) {
    const { surface } = this._edgeless;
    const connectors = surface
      .getElements()
      .filter(e => e.type === 'connector') as ConnectorElement[];
    const results: Connectable[] = [];
    connectors.forEach(connector => {
      if (connector.source.id === element.id && connector.target.id) {
        results.push(surface.pickById(connector.target.id) as Connectable);
      } else if (connector.target.id === element.id && connector.source.id) {
        results.push(surface.pickById(connector.source.id) as Connectable);
      }
    });
    return results;
  }
}
