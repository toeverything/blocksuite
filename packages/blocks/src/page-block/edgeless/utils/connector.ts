import {
  almostEqual,
  Bound,
  type ConnectorElement,
  type IVec,
  lineIntersects,
  linePolygonIntersects,
  Vec,
} from '@blocksuite/phasor';
import { assertExists } from '@blocksuite/store';

import type { Connectable } from '../../../__internal__/utils/types.js';
import type { Selectable } from '../utils/selection-manager.js';
import { isTopLevelBlock } from './query.js';

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

export function getConnectablePoints(
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
  function pushWithPriority(vecs: IVec[], priority = 0) {
    points.push(...vecs.map(vec => [...vec, priority]));
  }
  function pushLineIntersectsToPoints(
    aLine: IVec[],
    bLine: IVec[],
    priority = 0
  ) {
    const rst = lineIntersects(aLine[0], aLine[1], bLine[0], bLine[1], true);
    if (rst) {
      pushWithPriority([rst], priority);
    }
  }
  pushWithPriority(lineBound.getVerticesAndMidpoints());

  if (!startBound || !endBound) {
    pushWithPriority([lineBound.center], 6);
  }
  if (expandStartBound && expandEndBound && outerBound) {
    pushWithPriority(outerBound.getVerticesAndMidpoints());
    pushWithPriority([outerBound.center], 2);
    [
      expandStartBound.upperLine,
      expandStartBound.horizontalLine,
      expandStartBound.lowerLine,
      expandEndBound.upperLine,
      expandEndBound.horizontalLine,
      expandEndBound.lowerLine,
    ].forEach(line => {
      pushLineIntersectsToPoints(line, outerBound.leftLine, 0);
      pushLineIntersectsToPoints(line, outerBound.rightLine, 0);
    });
    [
      expandStartBound.leftLine,
      expandStartBound.verticalLine,
      expandStartBound.rightLine,
      expandEndBound.leftLine,
      expandEndBound.verticalLine,
      expandEndBound.rightLine,
    ].forEach(line => {
      pushLineIntersectsToPoints(line, outerBound.upperLine, 0);
      pushLineIntersectsToPoints(line, outerBound.lowerLine, 0);
    });
  }

  function pushBoundMidPoint(b1: Bound, b2: Bound, eb1: Bound, eb2: Bound) {
    if (b1.maxX < b2.x) {
      const midX = (b1.maxX + b2.x) / 2;
      [
        eb1.horizontalLine,
        eb2.horizontalLine,
        eb1.upperLine,

        eb1.lowerLine,
        eb2.upperLine,

        eb2.lowerLine,
      ].forEach((line, index) => {
        pushLineIntersectsToPoints(
          line,
          [
            [midX, 0],
            [midX, 1],
          ],
          index === 0 || index === 1 ? 6 : 3
        );
      });
    }
    if (b1.maxY < b2.y) {
      const midY = (b1.maxY + b2.y) / 2;
      [
        eb1.verticalLine,
        eb2.verticalLine,
        eb1.leftLine,
        eb1.rightLine,
        eb2.leftLine,
        eb2.rightLine,
      ].forEach((line, index) => {
        pushLineIntersectsToPoints(
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
      pushWithPriority([midPoint], 6);
      [
        expandBound.leftLine,
        expandBound.rightLine,
        expandBound2.leftLine,
        expandBound2.rightLine,
      ].forEach(line => {
        pushLineIntersectsToPoints(
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
      pushWithPriority([midPoint], 6);
      [
        expandBound.upperLine,
        expandBound.lowerLine,
        expandBound2.upperLine,
        expandBound2.lowerLine,
      ].forEach(line => {
        pushLineIntersectsToPoints(
          [midPoint, [midPoint[0], midPoint[1] + 1]],
          line,
          0
        );
      });
    }
  }
  if (startBound && endBound && expandStartBound && expandEndBound) {
    pushGapMidPoint(
      startPoint,
      startBound,
      endBound,
      expandStartBound,
      expandEndBound
    );
    pushGapMidPoint(
      endPoint,
      endBound,
      startBound,
      expandEndBound,
      expandStartBound
    );
    pushBoundMidPoint(startBound, endBound, expandStartBound, expandEndBound);
    pushBoundMidPoint(endBound, startBound, expandEndBound, expandStartBound);
  }

  if (expandStartBound) {
    pushWithPriority(expandStartBound.getVerticesAndMidpoints());
    pushWithPriority(
      expandStartBound.include(lastEndPoint).getVerticesAndMidpoints()
    );
  }

  if (expandEndBound) {
    pushWithPriority(expandEndBound.getVerticesAndMidpoints());
    pushWithPriority(
      expandEndBound.include(nextStartPoint).getVerticesAndMidpoints()
    );
  }

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

export function getAnchors(ele: Connectable) {
  const b = Bound.deserialize(ele.xywh);
  const offset = 10;
  const anchors: { point: IVec; coord: IVec }[] = [];
  const coords = [
    [0.5, 0],
    [0.5, 1],
    [0, 0.5],
    [1, 0.5],
  ];
  [
    [b.center[0], b.y - offset],
    [b.center[0], b.maxY + offset],
    [b.x - offset, b.center[1]],
    [b.maxX + offset, b.center[1]],
  ].forEach((vec, index) => {
    const rst = connectableIntersectLine(ele, [b.center, vec]);
    if (rst) anchors.push({ point: rst[0], coord: coords[index] });
  });
  return anchors;
}

export function connectableIntersectLine(ele: Connectable, line: IVec[]) {
  if (isTopLevelBlock(ele)) {
    return linePolygonIntersects(
      line[0],
      line[1],
      Bound.deserialize(ele.xywh).points
    );
  } else {
    return ele.intersectWithLine(line[0], line[1]);
  }
}

export function getConnectableNearestAnchor(ele: Connectable, point: IVec) {
  const anchors = getAnchors(ele);
  return closestPoint(
    anchors.map(a => a.point),
    point
  );
}

function closestPoint(points: IVec[], point: IVec) {
  const rst = points.map(p => ({ p, d: Vec.dist(p, point) }));
  rst.sort((a, b) => a.d - b.d);
  return rst[0].p;
}

export function computePoints(
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
    filterConnectablePoints(points, startBound),
    endBound
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
