import type { ConnectorElement, SurfaceManager } from '@blocksuite/phasor';
import {
  almostEqual,
  AStarAlgorithm,
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
export class ConnectionOverlay extends Overlay {
  surface!: SurfaceManager;
  points: IVec[] = [];
  highlightPoint: IVec | undefined = undefined;
  rect: Bound | undefined = undefined;
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
    if (this.rect) {
      ctx.beginPath();
      ctx.rect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
      ctx.fillStyle = 'rgba(211, 211, 211, 0.3)';
      ctx.fill();
    }
  }
  clear() {
    this.points = [];
    this.highlightPoint = undefined;
    this.rect = undefined;
  }
}

export class EdgelessConnectorManager {
  private _algorithm: AStarAlgorithm | undefined;
  private _connectionOverlay = new ConnectionOverlay();
  constructor(private _edgeless: EdgelessPageBlockComponent) {
    this._edgeless.surface.viewport.addOverlay(this._connectionOverlay);
    this._connectionOverlay.surface = this._edgeless.surface;
  }

  searchConnection(point: IVec, excludedIds: string[] = []) {
    const { _connectionOverlay } = this;
    const { surface, page } = this._edgeless;
    const { viewport } = surface;
    const surfaceElements = surface
      .pickByBound(Bound.from(viewport.viewportBounds))
      .filter(ele => ele.connectable);
    const notes = (<TopLevelBlockModel[]>(
      page.getBlockByFlavour('affine:note')
    )).filter(n => viewport.isInViewport(Bound.deserialize(n.xywh)));
    const connectables: Connectable[] = [...surfaceElements, ...notes];
    _connectionOverlay.clear();
    for (let i = 0; i < connectables.length; i++) {
      const connectable = connectables[i];
      if (excludedIds.includes(connectable.id)) continue;
      const bound = Bound.deserialize(connectables[i].xywh);
      const expandBound = bound.expand(10);
      if (!expandBound.isPointInBound(point)) continue;
      const anchors = this.getAnchors(connectable);
      _connectionOverlay.rect = bound;
      _connectionOverlay.points = anchors.map(a => a.point);
      for (let j = 0; j < anchors.length; j++) {
        const anchor = anchors[j];
        if (Vec.dist(anchor.point, point) < 4) {
          _connectionOverlay.highlightPoint = anchor.point;
          surface.refresh();
          return {
            id: connectable.id,
            position: anchor.coord,
          };
        }
      }
      const nearestPoint = this._getConnectableNearestPoint(connectable, point);
      if (Vec.dist(nearestPoint, point) < 8) {
        _connectionOverlay.highlightPoint = nearestPoint;
        surface.refresh();
        return {
          id: connectable.id,
          position: bound.toRelative(nearestPoint).map(n => clamp(n, 0, 1)),
        };
      }
      if (bound.isPointInBound(point)) {
        surface.refresh();
        return {
          id: connectable.id,
        };
      }
    }
    surface.refresh();
    return {
      position: point,
    };
  }

  clear() {
    this._connectionOverlay.points = [];
    this._connectionOverlay.highlightPoint = undefined;
    this._connectionOverlay.rect = undefined;
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
    const rst = this.searchConnection(point, anotherId ? [anotherId] : []);
    surface.updateElement<'connector'>(id, {
      [connection]: rst,
    });
  }

  updatePath(connector: ConnectorElement, path?: IVec[]) {
    const { surface } = this._edgeless;
    const points = path ?? this.generateConnectorPath(connector) ?? [];
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

  generateConnectorPath(connector: ConnectorElement) {
    const { mode } = connector;
    if (mode === ConnectorMode.Straight) {
      return this.generateStraightConnectorPath(connector);
    } else {
      return this.generateOrthogonalConnector(connector);
    }
  }

  generateStraightConnectorPath(connector: ConnectorElement) {
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
      const startPoint = this.getNearestAnchor(start, eb.center);
      const endPoint = this.getNearestAnchor(end, sb.center);
      return [startPoint, endPoint];
    } else {
      const endPoint = this._getConnectionPoint(connector, 'target');
      const startPoint = this._getConnectionPoint(connector, 'source');
      return (startPoint && endPoint && [startPoint, endPoint]) ?? [];
    }
  }

  private _computeOffset(bound: Bound, bound2: Bound) {
    const rst: IVec = [20, 20, 20, 20];
    // left, top, right, bottom
    let dist = Vec.distanceToLineSegment(
      bound.leftLine[0],
      bound.leftLine[1],
      bound2.rightLine[0],
      false
    );
    rst[0] = Math.max(Math.min(dist / 2, rst[0]), 0);
    dist = Vec.distanceToLineSegment(
      bound.upperLine[0],
      bound.upperLine[1],
      bound2.lowerLine[0],
      false
    );
    rst[1] = Math.max(Math.min(dist / 2, rst[1]), 0);
    dist = Vec.distanceToLineSegment(
      bound.rightLine[0],
      bound.rightLine[1],
      bound2.leftLine[0],
      false
    );
    rst[2] = Math.max(Math.min(dist / 2, rst[2]), 0);
    dist = Vec.distanceToLineSegment(
      bound.lowerLine[0],
      bound.lowerLine[1],
      bound2.upperLine[0],
      false
    );
    rst[3] = Math.max(Math.min(dist / 2, rst[3]), 0);

    return rst;
  }

  generateOrthogonalConnector(connector: ConnectorElement) {
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
    let sb: Bound | undefined = undefined;
    let eb: Bound | undefined = undefined;
    const blocks = [];
    const expandBlocks = [];
    if (start) {
      sb = Bound.deserialize(start.xywh);
    }
    if (end) {
      eb = Bound.deserialize(end.xywh);
    }

    let nextStartPoint: IVec;
    let lastEndPoint: IVec;
    const { source, target } = connector;
    if (source.id && !source.position && target.id && !target.position) {
      const startAnchors = this.getAnchors(start);
      const endAnchors = this.getAnchors(end);
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
    if (sb && eb) {
      startOffset = this._computeOffset(sb, eb);
      // endOffset = this._computeOffset(, eb, sb);
      startOffset[0] = endOffset[2] = Math.min(startOffset[0], endOffset[2]);
      startOffset[1] = endOffset[3] = Math.min(startOffset[1], endOffset[3]);
      startOffset[2] = endOffset[0] = Math.min(startOffset[2], endOffset[0]);
      startOffset[3] = endOffset[1] = Math.min(startOffset[3], endOffset[1]);
    }
    if (sb) {
      nextStartPoint = this._getNextPoint(
        sb,
        startPoint,
        startOffset[0],
        startOffset[1],
        startOffset[2],
        startOffset[3]
      );
    } else {
      nextStartPoint = startPoint;
    }
    if (eb) {
      lastEndPoint = this._getNextPoint(
        eb,
        endPoint,
        endOffset[0],
        endOffset[1],
        endOffset[2],
        endOffset[3]
      );
    } else {
      lastEndPoint = endPoint;
    }
    let esb: Bound | undefined = undefined;
    let eeb: Bound | undefined = undefined;
    if (
      (sb && sb.isPointInBound(endPoint)) ||
      (eb && eb.isPointInBound(startPoint))
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
    if (sb) {
      blocks.push(sb.clone());
      esb = sb.expand(
        startOffset[0],
        startOffset[1],
        startOffset[2],
        startOffset[3]
      );
      expandBlocks.push(esb);
    }
    if (eb) {
      blocks.push(eb.clone());
      eeb = eb.expand(endOffset[0], endOffset[1], endOffset[2], endOffset[3]);
      expandBlocks.push(eeb.clone());
    }
    startPoint = this._conversion(startPoint);
    endPoint = this._conversion(endPoint);
    nextStartPoint = this._conversion(nextStartPoint);
    lastEndPoint = this._conversion(lastEndPoint);
    const rst = this.getConnectablePoints(
      startPoint,
      endPoint,
      nextStartPoint,
      lastEndPoint,
      sb,
      eb,
      esb,
      eeb
    );
    const points = rst.points;
    nextStartPoint = rst.sp;
    lastEndPoint = rst.ep;
    const finalPoints = this.filterConnectablePoints(
      this.filterConnectablePoints(points, sb),
      eb
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
    this._algorithm = new AStarAlgorithm(
      finalPoints,
      nextStartPoint,
      lastEndPoint,
      startPoint,
      endPoint,
      blocks,
      expandBlocks
    );
    this._algorithm.run();
    let path = this._algorithm.path;
    if (!end) path.pop();
    if (!start) path.shift();

    path = this._mergePath(path);
    return path;
  }

  private _mergePath(points: IVec[]) {
    if (points.length === 0) return [];
    const rst: IVec[] = [[points[0][0], points[0][1]]];
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
      rst.push([cur[0], cur[1]]);
    }
    rst.push(points[points.length - 1]);
    for (let i = 0; i < rst.length - 1; i++) {
      const cur = rst[i];
      const next = rst[i + 1];
      try {
        assertEquals(
          almostEqual(cur[0], next[0], 0.02) ||
            almostEqual(cur[1], next[1], 0.02),
          true
        );
      } catch (e) {
        console.log(points);
        console.log(rst);
      }
    }
    return rst;
  }

  private _conversion(point: IVec) {
    return [
      Number(point[0].toFixed(2)),
      Number(point[1].toFixed(2)),
      point[2] ?? 0,
    ];
  }

  private filterConnectablePoints(points: IVec[], bound?: Bound) {
    return points.filter(point => {
      if (!bound) return true;
      return !bound.isPointInBound(point);
    });
  }

  private getConnectablePoints(
    osp: IVec,
    oep: IVec,
    sp: IVec,
    ep: IVec,
    sb?: Bound,
    eb?: Bound,
    esb?: Bound,
    eeb?: Bound
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
    if (!sb && !eb) {
      points.push([...lineBound.center, 2]);
    }
    if (esb && eeb && outerBound) {
      // bounds.push(outerBound);
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
          eb1.upperLine,
          eb1.horizontalLine,
          eb1.lowerLine,
          eb2.upperLine,
          eb2.horizontalLine,
          eb2.lowerLine,
        ].forEach(line => {
          pushLineIntersectsToPoints(
            line,
            [
              [midX, 0],
              [midX, 1],
            ],
            3
          );
        });
      }
      if (b1.maxY < b2.y) {
        const midY = (b1.maxY + b2.y) / 2;
        [
          eb1.leftLine,
          eb1.verticalLine,
          eb1.rightLine,
          eb2.leftLine,
          eb2.verticalLine,
          eb2.rightLine,
        ].forEach(line => {
          pushLineIntersectsToPoints(
            line,
            [
              [0, midY],
              [1, midY],
            ],
            3
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
        const midPoint = [...Vec.lrp(rst[1], rst[2], 0.5), 3];
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
        const midPoint = [...Vec.lrp(rst[1], rst[2], 0.5), 3];
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
      const rst = lineIntersects(aLine[0], aLine[1], bLine[0], bLine[1], true);
      if (rst) {
        points.push([...rst, priority]);
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

  private _getNextPoint(
    bound: Bound,
    point: IVec,
    offsetX = 10,
    offsetY = 10,
    offsetW = 10,
    offsetH = 10
  ) {
    const rst = [...point];
    if (almostEqual(bound.x, rst[0])) rst[0] -= offsetX;
    else if (almostEqual(bound.y, rst[1])) rst[1] -= offsetY;
    if (almostEqual(bound.maxX, rst[0])) rst[0] += offsetW;
    else if (almostEqual(bound.maxY, rst[1])) rst[1] += offsetH;
    return rst;
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
        const rst = this.getNearestAnchor(ele, otherPoint);
        return rst;
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

  getAnchors(ele: Connectable) {
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
      const rst = this.intersectLine(ele, [b.center, vec]);
      if (rst) anchors.push({ point: rst[0], coord: coords[index] });
    });
    return anchors;
  }

  getNearestAnchor(ele: Connectable, point: IVec) {
    const anchors = this.getAnchors(ele);
    return this.closestPoint(
      anchors.map(a => a.point),
      point
    );
  }

  private closestPoint(points: IVec[], point: IVec) {
    const rst = points.map(p => ({ p, d: Vec.dist(p, point) }));
    rst.sort((a, b) => a.d - b.d);
    return rst[0].p;
  }

  private intersectLine(ele: Connectable, line: IVec[]) {
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

  syncConnectorPos(selected: Connectable[]) {
    const connectors = this.getConnecttedConnectors(selected);
    connectors.forEach(connector => {
      this.updatePath(connector);
    });
  }

  getConnecttedConnectors(elements: Connectable[]) {
    const { surface } = this._edgeless;
    const ids = new Set(elements.map(e => e.id));
    const connectors = surface
      .getElements()
      .filter(e => e.type === 'connector') as ConnectorElement[];
    const rst: ConnectorElement[] = [];
    connectors.forEach(connector => {
      if (
        (connector.source.id && ids.has(connector.source.id)) ||
        (connector.target.id && ids.has(connector.target.id))
      ) {
        rst.push(connector);
      }
    });
    return rst;
  }
}
