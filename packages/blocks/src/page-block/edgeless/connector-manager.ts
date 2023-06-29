import type {
  Connection,
  ConnectorElement,
  SurfaceManager,
} from '@blocksuite/phasor';
import {
  almostEqual,
  AStarRunner,
  Bound,
  clamp,
  ConnectorMode,
  getBoundFromPoints,
  type IConnector,
  type IVec,
  lineIntersects,
  linePolygonIntersects,
  Overlay,
  polygonNearestPoint,
  sign,
  Vec,
} from '@blocksuite/phasor';
import { assertEquals, assertExists } from '@blocksuite/store';

import {
  type Connectable,
  type TopLevelBlockModel,
} from '../../__internal__/utils/types.js';
import type { EdgelessPageBlockComponent } from './edgeless-page-block.js';
import { isTopLevelBlock } from './utils/query.js';
import type { Selectable } from './utils/selection-manager.js';

function getConnectablePoints(
  osp: IVec,
  oep: IVec,
  sp: IVec,
  ep: IVec,
  sb: Bound | null,
  eb: Bound | null,
  esb: Bound | null,
  eeb: Bound | null
) {
  const bounds: Bound[] = [];

  const lineBound = Bound.fromPoints([osp, oep]);
  // bounds.push(lineBound);
  const outerBound = esb && eeb && esb.unite(eeb);
  let points: IVec[] = [
    sp,
    ep,
    ...lineBound.points.map(point => [...point, 0]),
    ...lineBound.midPoints.map(point => [...point, 0]),
  ];
  if (!sb || !eb) {
    points.push([...lineBound.center, 6]);
  }
  if (esb && eeb && outerBound) {
    points.push(...outerBound.points.map(point => [...point, 0]));
    points.push(...outerBound.midPoints.map(point => [...point, 0]));
    points.push([...outerBound.center, 2]);
    [
      esb.upperLine,
      esb.horizontalLine,
      esb.lowerLine,
      eeb.upperLine,
      eeb.horizontalLine,
      eeb.lowerLine,
    ].forEach(line => {
      pushLineIntersectsToPoints(line, outerBound.leftLine, 0);
      pushLineIntersectsToPoints(line, outerBound.rightLine, 0);
    });
    [
      esb.leftLine,
      esb.verticalLine,
      esb.rightLine,
      eeb.leftLine,
      eeb.verticalLine,
      eeb.rightLine,
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
      const result = [
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
      result.sort((a, b) => a[1] - b[1]);
      const midPoint = [...Vec.lrp(result[1], result[2], 0.5), 6];
      points.push(midPoint);
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
      const result = [
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
      result.sort((a, b) => a[0] - b[0]);
      const midPoint = [...Vec.lrp(result[1], result[2], 0.5), 6];
      points.push(midPoint);
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
  if (sb && eb && esb && eeb) {
    pushGapMidPoint(osp, sb, eb, esb, eeb);
    pushGapMidPoint(oep, eb, sb, eeb, esb);
    pushBoundMidPoint(sb, eb, esb, eeb);
    pushBoundMidPoint(eb, sb, eeb, esb);
  }

  if (esb) {
    points.push(
      ...esb.points.map(point => [...point, 0]),
      ...esb.midPoints.map(point => [...point, 0])
    );
    points.push(...esb.include(ep).points.map(point => [...point, 0]));
    points.push(...esb.include(ep).midPoints.map(point => [...point, 0]));
    bounds.push(esb);
  }
  function pushLineIntersectsToPoints(
    aLine: IVec[],
    bLine: IVec[],
    priority = 0
  ) {
    const result = lineIntersects(aLine[0], aLine[1], bLine[0], bLine[1], true);
    if (result) {
      points.push([...result, priority]);
    }
  }
  if (eeb) {
    points.push(
      ...eeb.points.map(point => [...point, 0]),
      ...eeb.midPoints.map(point => [...point, 0])
    );
    points.push(...eeb.include(sp).points.map(point => [...point, 0]));
    points.push(...eeb.include(sp).midPoints.map(point => [...point, 0]));
    bounds.push(eeb);
  }
  points = points.map(point => [
    parseFloat(point[0].toFixed(2)),
    parseFloat(point[1].toFixed(2)),
    point[2] ?? 0,
  ]);
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
  const startEnds = [sp, ep].map(point => {
    return points.find(
      item =>
        almostEqual(item[0], point[0], 0.02) &&
        almostEqual(item[1], point[1], 0.02)
    );
  }) as IVec[];
  assertExists(startEnds[0]);
  assertExists(startEnds[1]);
  return { points, sp: startEnds[0], ep: startEnds[1] };
}

function closestPoint(points: IVec[], point: IVec) {
  const result = points.map(p => ({ p, d: Vec.dist(p, point) }));
  result.sort((a, b) => a.d - b.d);
  return result[0].p;
}

function intersectLine(ele: Connectable, line: IVec[]) {
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

function downscalePrecision(point: IVec) {
  return [
    Number(point[0].toFixed(2)),
    Number(point[1].toFixed(2)),
    point[2] ?? 0,
  ];
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

function computeOffset(bound: Bound, bound2: Bound) {
  const result: IVec = [20, 20, 20, 20];
  // left, top, right, bottom
  let dist = Vec.distanceToLineSegment(
    bound.leftLine[0],
    bound.leftLine[1],
    bound2.rightLine[0],
    false
  );
  result[0] = Math.max(Math.min(dist / 2, result[0]), 0);
  dist = Vec.distanceToLineSegment(
    bound.upperLine[0],
    bound.upperLine[1],
    bound2.lowerLine[0],
    false
  );
  result[1] = Math.max(Math.min(dist / 2, result[1]), 0);
  dist = Vec.distanceToLineSegment(
    bound.rightLine[0],
    bound.rightLine[1],
    bound2.leftLine[0],
    false
  );
  result[2] = Math.max(Math.min(dist / 2, result[2]), 0);
  dist = Vec.distanceToLineSegment(
    bound.lowerLine[0],
    bound.lowerLine[1],
    bound2.upperLine[0],
    false
  );
  result[3] = Math.max(Math.min(dist / 2, result[3]), 0);

  return result;
}

function filterConnectablePoints(points: IVec[], bound: Bound | null) {
  return points.filter(point => {
    if (!bound) return true;
    return !bound.isPointInBound(point);
  });
}

function getNextPoint(
  bound: Bound,
  point: IVec,
  offsetX = 10,
  offsetY = 10,
  offsetW = 10,
  offsetH = 10
) {
  const result = [...point];
  if (almostEqual(bound.x, result[0])) result[0] -= offsetX;
  else if (almostEqual(bound.y, result[1])) result[1] -= offsetY;
  if (almostEqual(bound.maxX, result[0])) result[0] += offsetW;
  else if (almostEqual(bound.maxY, result[1])) result[1] += offsetH;
  return result;
}

export class ConnectionOverlay extends Overlay {
  surface!: SurfaceManager;
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

export class EdgelessConnectorManager {
  private _aStarRunner: AStarRunner | null = null;
  private _connectionOverlay = new ConnectionOverlay();
  constructor(private _edgeless: EdgelessPageBlockComponent) {
    this._edgeless.surface.viewport.addOverlay(this._connectionOverlay);
    this._connectionOverlay.surface = this._edgeless.surface;
  }

  private _findConnectablesInViewport() {
    const { surface, page } = this._edgeless;
    const { viewport } = surface;
    const surfaceElements = surface
      .pickByBound(Bound.from(viewport.viewportBounds))
      .filter(ele => ele.connectable);
    const notes = (<TopLevelBlockModel[]>(
      page.getBlockByFlavour('affine:note')
    )).filter(n => viewport.isInViewport(Bound.deserialize(n.xywh)));
    return [...surfaceElements, ...notes] as Connectable[];
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
      const bound = Bound.deserialize(connectables[i].xywh);
      const expandBound = bound.expand(10);
      if (!expandBound.isPointInBound(point)) continue;
      _connectionOverlay.bound = bound;

      // then check if closes to anchors
      const anchors = this._getAnchors(connectable);
      _connectionOverlay.points = anchors.map(a => a.point);
      for (let j = 0; j < anchors.length; j++) {
        const anchor = anchors[j];
        if (Vec.dist(anchor.point, point) < 4) {
          _connectionOverlay.highlightPoint = anchor.point;
          result = {
            id: connectable.id,
            position: anchor.coord,
          };
        }
      }
      if (result) break;

      // if not, check if closes to bound
      const nearestPoint = this._getConnectableNearestPoint(connectable, point);
      if (Vec.dist(nearestPoint, point) < 8) {
        _connectionOverlay.highlightPoint = nearestPoint;
        surface.refresh();
        result = {
          id: connectable.id,
          position: bound.toRelative(nearestPoint).map(n => clamp(n, 0, 1)),
        };
      }

      // if not, check if in original bound
      if (bound.isPointInBound(point)) {
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

  private _getConnectableNearestPoint(connectable: Connectable, point: IVec) {
    if (isTopLevelBlock(connectable)) {
      return polygonNearestPoint(
        Bound.deserialize(connectable.xywh).points,
        point
      );
    } else {
      return connectable.getNearestPoint(point);
    }
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
    surface.updateElement<'connector'>(id, {
      [connection]: result,
    });
  }

  updatePath(connector: ConnectorElement, path?: IVec[]) {
    const { surface } = this._edgeless;
    const points = path ?? this._generateConnectorPath(connector) ?? [];
    const bound = getBoundFromPoints(points);
    const relativePoints = points.map(p => Vec.sub(p, [bound.x, bound.y]));
    connector.path = relativePoints;
    connector.xywh = bound.serialize();
    surface.refresh();
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
    surface.updateElement<'connector'>(connector.id, updates);
  }

  private _generateConnectorPath(connector: ConnectorElement) {
    const { mode } = connector;
    if (mode === ConnectorMode.Straight) {
      return this._generateStraightConnectorPath(connector);
    } else {
      return this._generateOrthogonalConnector(connector);
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
      const startPoint = this._getNearestAnchor(start, eb.center);
      const endPoint = this._getNearestAnchor(end, sb.center);
      return [startPoint, endPoint];
    } else {
      const endPoint = this._getConnectionPoint(connector, 'target');
      const startPoint = this._getConnectionPoint(connector, 'source');
      return (startPoint && endPoint && [startPoint, endPoint]) ?? [];
    }
  }

  private _generateOrthogonalConnector(connector: ConnectorElement) {
    const start = this._getConnectorEndElement(
      connector,
      'source'
    ) as Connectable;
    const end = this._getConnectorEndElement(
      connector,
      'target'
    ) as Connectable;

    let startPoint: IVec;
    let endPoint: IVec;
    let startBound: Bound | null = null;
    let endBound: Bound | null = null;
    const blocks = [];
    const expandBlocks = [];
    if (start) {
      startBound = Bound.deserialize(start.xywh);
    }
    if (end) {
      endBound = Bound.deserialize(end.xywh);
    }

    let nextStartPoint: IVec;
    let lastEndPoint: IVec;
    const { source, target } = connector;
    if (source.id && !source.position && target.id && !target.position) {
      const startAnchors = this._getAnchors(start);
      const endAnchors = this._getAnchors(end);
      let minDist = Infinity;
      let minStartAnchor: IVec = [0, 0];
      let minEndAnchor: IVec = [0, 0];
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
    let startOffset = [20, 20, 20, 20];
    const endOffset = [20, 20, 20, 20];
    if (startBound && endBound) {
      startOffset = computeOffset(startBound, endBound);
      // endOffset = this._computeOffset(, eb, sb);
      startOffset[0] = endOffset[2] = Math.min(startOffset[0], endOffset[2]);
      startOffset[1] = endOffset[3] = Math.min(startOffset[1], endOffset[3]);
      startOffset[2] = endOffset[0] = Math.min(startOffset[2], endOffset[0]);
      startOffset[3] = endOffset[1] = Math.min(startOffset[3], endOffset[1]);
    }
    if (startBound) {
      nextStartPoint = getNextPoint(
        startBound,
        startPoint,
        startOffset[0],
        startOffset[1],
        startOffset[2],
        startOffset[3]
      );
    } else {
      nextStartPoint = startPoint;
    }
    if (endBound) {
      lastEndPoint = getNextPoint(
        endBound,
        endPoint,
        endOffset[0],
        endOffset[1],
        endOffset[2],
        endOffset[3]
      );
    } else {
      lastEndPoint = endPoint;
    }
    let expandedStartBound: Bound | null = null;
    let expandedEndBound: Bound | null = null;
    if (
      (startBound && startBound.isPointInBound(endPoint)) ||
      (endBound && endBound.isPointInBound(startPoint))
    ) {
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
    if (startBound) {
      blocks.push(startBound.clone());
      expandedStartBound = startBound.expand(
        startOffset[0],
        startOffset[1],
        startOffset[2],
        startOffset[3]
      );
      expandBlocks.push(expandedStartBound);
    }
    if (endBound) {
      blocks.push(endBound.clone());
      expandedEndBound = endBound.expand(
        endOffset[0],
        endOffset[1],
        endOffset[2],
        endOffset[3]
      );
      expandBlocks.push(expandedEndBound.clone());
    }
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
      expandedStartBound,
      expandedEndBound
    );
    const points = result.points;
    nextStartPoint = result.sp;
    lastEndPoint = result.ep;
    const finalPoints = filterConnectablePoints(
      filterConnectablePoints(points, startBound),
      endBound
    );

    if (!end) {
      if (
        Math.abs(endPoint[0] - startPoint[0]) >
        Math.abs(endPoint[1] - startPoint[1])
      ) {
        endPoint[0] += sign(endPoint[0] - startPoint[0]);
      } else {
        endPoint[1] += sign(endPoint[1] - startPoint[1]);
      }
    }
    if (!start) {
      if (
        Math.abs(endPoint[0] - startPoint[0]) >
        Math.abs(endPoint[1] - startPoint[1])
      ) {
        startPoint[0] -= sign(endPoint[0] - startPoint[0]);
      } else {
        startPoint[1] -= sign(endPoint[1] - startPoint[1]);
      }
    }
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
    if (!end) path.pop();
    if (!start) path.shift();

    path = mergePath(path);
    return path;
  }

  private _getConnectorEndElement(
    connector: IConnector,
    type: 'source' | 'target'
  ) {
    const { surface, page } = this._edgeless;
    const id = connector[type].id;
    if (id) {
      return surface.pickById(id) ?? <TopLevelBlockModel>page.getBlockById(id);
    }
    return null;
  }

  private _getConnectionPoint(
    connector: IConnector,
    type: 'source' | 'target'
  ) {
    const connection = connector[type];
    const anotherType = type === 'source' ? 'target' : 'source';
    let point: IVec = [];
    if (connection.id) {
      const ele = this._getConnectorEndElement(connector, type);
      assertExists(ele);
      if (!connection.position) {
        const otherPoint = this._getConnectionPoint(connector, anotherType);
        const result = this._getNearestAnchor(ele, otherPoint);
        return result;
      } else {
        point = Bound.deserialize(ele.xywh).getRelativePoint(
          connection.position
        );
      }
    } else {
      point = connection.position as IVec;
    }
    return point;
  }

  private _getAnchors(ele: Connectable) {
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
      const result = intersectLine(ele, [b.center, vec]);
      if (result) anchors.push({ point: result[0], coord: coords[index] });
    });
    return anchors;
  }

  private _getNearestAnchor(ele: Connectable, point: IVec) {
    const anchors = this._getAnchors(ele);
    return closestPoint(
      anchors.map(a => a.point),
      point
    );
  }

  isConnectorAndBindingsAllSelected(
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

    if (!source.id && !target.id) return true;
    if (!source.id && endSelected) return true;
    if (!target.id && startSelected) return true;
    if (startSelected && endSelected) return true;
    return false;
  }

  syncConnectorPos(connected: Connectable[]) {
    const connectors = this.getConnecttedConnectors(connected);
    connectors.forEach(connector => this.updatePath(connector));
  }

  updateConnectorWhenDeleted(connected: Connectable[]) {
    const surface = this._edgeless.surface;
    connected.forEach(ele => {
      this.getConnecttedConnectors([ele]).forEach(connector => {
        const absolutePath = connector.absolutePath;
        if (connector.source.id === ele.id) {
          surface.updateElement<'connector'>(connector.id, {
            source: { position: absolutePath[0] },
          });
        } else if (connector.target.id === ele.id) {
          surface.updateElement<'connector'>(connector.id, {
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
}
