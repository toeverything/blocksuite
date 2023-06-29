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
import {
  computePoints,
  getAnchors,
  getConnectableNearestAnchor,
} from './utils/connector.js';
import { isTopLevelBlock } from './utils/query.js';

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
  let dist = Vec.distanceToLineSegment(
    startBound.leftLine[0],
    startBound.leftLine[1],
    endBound.rightLine[0],
    false
  );
  startOffset[0] = Math.max(Math.min(dist / 2, startOffset[0]), 0);
  dist = Vec.distanceToLineSegment(
    startBound.upperLine[0],
    startBound.upperLine[1],
    endBound.lowerLine[0],
    false
  );
  startOffset[1] = Math.max(Math.min(dist / 2, startOffset[1]), 0);
  dist = Vec.distanceToLineSegment(
    startBound.rightLine[0],
    startBound.rightLine[1],
    endBound.leftLine[0],
    false
  );
  startOffset[2] = Math.max(Math.min(dist / 2, startOffset[2]), 0);
  dist = Vec.distanceToLineSegment(
    startBound.lowerLine[0],
    startBound.lowerLine[1],
    endBound.upperLine[0],
    false
  );
  startOffset[3] = Math.max(Math.min(dist / 2, startOffset[3]), 0);

  startOffset[0] = endOffset[2] = Math.min(startOffset[0], endOffset[2]);
  startOffset[1] = endOffset[3] = Math.min(startOffset[1], endOffset[3]);
  startOffset[2] = endOffset[0] = Math.min(startOffset[2], endOffset[0]);
  startOffset[3] = endOffset[1] = Math.min(startOffset[3], endOffset[1]);

  return [startOffset, endOffset];
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
      const anchors = getAnchors(connectable);
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
      return this._generateOrthogonalConnectorPath(connector);
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
      const startPoint = getConnectableNearestAnchor(start, eb.center);
      const endPoint = getConnectableNearestAnchor(end, sb.center);
      return [startPoint, endPoint];
    } else {
      const endPoint = this._getConnectionPoint(connector, 'target');
      const startPoint = this._getConnectionPoint(connector, 'source');
      return (startPoint && endPoint && [startPoint, endPoint]) ?? [];
    }
  }

  private _prepareOrthogonalConnectorInfo(
    connector: ConnectorElement
  ): [
    IVec,
    IVec,
    IVec,
    IVec,
    Bound | null,
    Bound | null,
    Bound | null,
    Bound | null
  ] {
    const start = this._getConnectorEndElement(
      connector,
      'source'
    ) as Connectable;
    const end = this._getConnectorEndElement(
      connector,
      'target'
    ) as Connectable;
    const [startPoint, endPoint] = this._computeStartEndPoint(connector);
    const startBound = start ? Bound.deserialize(start.xywh) : null;
    const endBound = end ? Bound.deserialize(end.xywh) : null;
    const [startOffset, endOffset] = computeOffset(startBound, endBound);
    const [nextStartPoint, lastEndPoint] = this._computeNextStartEndPoint(
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

  private _computeStartEndPoint(connector: ConnectorElement) {
    const { source, target } = connector;
    const start = this._getConnectorEndElement(
      connector,
      'source'
    ) as Connectable;
    const end = this._getConnectorEndElement(
      connector,
      'target'
    ) as Connectable;
    let startPoint: IVec, endPoint: IVec;
    if (source.id && !source.position && target.id && !target.position) {
      const startAnchors = getAnchors(start);
      const endAnchors = getAnchors(end);
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
    return [startPoint, endPoint];
  }

  private _computeNextStartEndPoint(
    startPoint: IVec,
    endPoint: IVec,
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

  private _adjustStartEndPoint(
    startPoint: IVec,
    endPoint: IVec,
    startBound: Bound | null,
    endBound: Bound | null
  ) {
    if (!endBound) {
      if (
        Math.abs(endPoint[0] - startPoint[0]) >
        Math.abs(endPoint[1] - startPoint[1])
      ) {
        endPoint[0] += sign(endPoint[0] - startPoint[0]);
      } else {
        endPoint[1] += sign(endPoint[1] - startPoint[1]);
      }
    }
    if (!startBound) {
      if (
        Math.abs(endPoint[0] - startPoint[0]) >
        Math.abs(endPoint[1] - startPoint[1])
      ) {
        startPoint[0] -= sign(endPoint[0] - startPoint[0]);
      } else {
        startPoint[1] -= sign(endPoint[1] - startPoint[1]);
      }
    }
  }

  _generateOrthogonalConnectorPath(connector: ConnectorElement) {
    const info = this._prepareOrthogonalConnectorInfo(connector);
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
      (startBound && startBound.isPointInBound(endPoint)) ||
      (endBound && endBound.isPointInBound(startPoint))
    ) {
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
    this._adjustStartEndPoint(startPoint, endPoint, startBound, endBound);
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
        const rst = getConnectableNearestAnchor(ele, otherPoint);
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
