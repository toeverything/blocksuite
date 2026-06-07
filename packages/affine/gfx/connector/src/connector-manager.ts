import { AStarRunner, Overlay } from '@blocksuite/affine-block-surface';
import {
  type BrushElementModel,
  type Connection,
  ConnectorElementModel,
  ConnectorMode,
  DEFAULT_POLYGON_VERTICES,
  GroupElementModel,
  type LocalConnectorElementModel,
  ShapeElementModel,
  ShapeType,
} from '@blocksuite/affine-model';
import {
  EditPropsStore,
  ThemeProvider,
} from '@blocksuite/affine-shared/services';
import { BlockSuiteError } from '@blocksuite/global/exceptions';
import type { IBound, IVec, IVec3 } from '@blocksuite/global/gfx';
import {
  almostEqual,
  Bound,
  getBezierCurveBoundingBox,
  getBezierParameters,
  getBoundFromPoints,
  getBoundWithRotation,
  getPointFromBoundsWithRotation,
  isOverlap,
  isVecZero,
  lineIntersects,
  PI2,
  PointLocation,
  polygonCentroid,
  sign,
  toRadian,
  Vec,
} from '@blocksuite/global/gfx';
import { assertType } from '@blocksuite/global/utils';
import type { BlockStdScope } from '@blocksuite/std';
import type {
  GfxController,
  GfxLocalElementModel,
  GfxModel,
} from '@blocksuite/std/gfx';
import { effect } from '@preact/signals-core';
import last from 'lodash-es/last';

export type Connectable = Exclude<
  GfxModel,
  ConnectorElementModel | BrushElementModel | GroupElementModel
>;

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

export const ConnectorEndpointLocationsWithCenter: IVec[] = [
  // At top
  [0.5, 0],
  // At right
  [1, 0.5],
  // At bottom
  [0.5, 1],
  // At left
  [0, 0.5],
  // At center
  [0.5, 0.5],
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
  // At center
  [0.5, 0.5],
];

/**
 * Checks if a GfxModel is a shape eligible for center anchor point.
 * Only Rect (including roundedRect), Ellipse, Diamond, and Triangle are eligible.
 * Triangle and other complex shapes are excluded.
 */
export function isCenterAnchorEligible(ele: GfxModel): boolean {
  if (!(ele instanceof ShapeElementModel)) return false;
  const { shapeType } = ele;
  return (
    shapeType === ShapeType.Rect ||
    shapeType === ShapeType.Ellipse ||
    shapeType === ShapeType.Diamond ||
    shapeType === ShapeType.Triangle ||
    shapeType === ShapeType.Polygon
  );
}

/**
 * Returns the normalized [0..1] coordinate of a shape's center anchor.
 * For polygons this is the geometric centroid of the (normalized) vertices;
 * for all other eligible shapes it is the bounding-box center [0.5, 0.5].
 */
function getCenterAnchorCoord(ele: GfxModel): IVec {
  if (ele instanceof ShapeElementModel && ele.shapeType === ShapeType.Polygon) {
    return polygonCentroid(ele.vertices ?? DEFAULT_POLYGON_VERTICES);
  }
  return [0.5, 0.5];
}

/**
 * Checks if the center anchor feature is enabled via the global toggle.
 * Defaults to true (enabled) when no value is stored in localStorage.
 */
export function isCenterAnchorEnabled(std: BlockStdScope): boolean {
  const store = std.getOptional(EditPropsStore);
  if (!store) return true;
  return store.getStorage('connectorCenterAnchor') ?? true;
}

/**
 * Checks if a normalized anchor position is the shape's center anchor.
 * Shape-aware: for polygons the center is the geometric centroid, otherwise
 * the bounding-box center [0.5, 0.5].
 */
function isCenterAnchorPosition(position: IVec, ele: GfxModel): boolean {
  const [cx, cy] = getCenterAnchorCoord(ele);
  return (
    almostEqual(position[0], cx, 0.001) && almostEqual(position[1], cy, 0.001)
  );
}

/**
 * For a center-anchored connector endpoint, computes the perimeter intersection
 * point so the connector visually terminates at the shape edge rather than
 * penetrating to the center. The logical anchor remains [0.5, 0.5] but the
 * visual endpoint is where the line from otherPoint to center crosses the
 * shape boundary.
 *
 * Handles each eligible shape type (Rect, roundedRect, Ellipse, Diamond, Triangle) by
 * using the shape's own getLineIntersections method, which dispatches to
 * shape-specific geometry (polygon boundary for Rect/Diamond, ellipse math
 * for Ellipse). For roundedRect, the polygon approximation of the bounding
 * rectangle is used, which is consistent with existing edge anchor behavior.
 *
 * The function extends the ray beyond the center to handle cases where
 * otherPoint is inside or very close to the shape, ensuring a boundary
 * intersection is always found.
 *
 * Returns a new PointLocation at the perimeter with an appropriate tangent,
 * or the original centerPoint if no intersection is found.
 */
function computePerimeterPointForCenterAnchor(
  connectable: GfxModel,
  centerPoint: PointLocation,
  otherPoint: PointLocation
): PointLocation {
  const bound = Bound.deserialize(connectable.xywh);
  const center: IVec = [centerPoint[0], centerPoint[1]];
  const other: IVec = [otherPoint[0], otherPoint[1]];

  // Compute direction from other point to center
  let direction = Vec.sub(center, other);
  const dirLen = Vec.len(direction);

  // If the other point is effectively at the center (e.g. both endpoints
  // on the same shape center, or overlapping shapes), use a default
  // direction pointing right — this gives a deterministic perimeter point
  if (dirLen < 0.01) {
    direction = [1, 0];
  } else {
    direction = Vec.normalize(direction);
  }

  // Extend the ray well beyond the center through the shape to guarantee
  // it crosses the boundary, even when otherPoint is inside the shape.
  // Use the shape's diagonal length as a generous extension distance.
  const diagonal = Math.sqrt(bound.w * bound.w + bound.h * bound.h);
  const rayStart = Vec.sub(center, Vec.mul(direction, diagonal));
  const rayEnd = Vec.add(center, Vec.mul(direction, diagonal));

  // Use shape-specific line intersection (rect uses polygon, ellipse uses
  // analytic ellipse math, diamond uses polygon)
  const intersections = connectable.getLineIntersections(rayStart, rayEnd);

  if (intersections && intersections.length > 0) {
    // Pick the intersection closest to the other point — this is the
    // perimeter point that the connector should visually terminate at
    // (the "entry" side of the shape from the other endpoint's perspective)
    let bestIntersection = intersections[0];
    let bestDist = Vec.dist(bestIntersection, other);

    for (let i = 1; i < intersections.length; i++) {
      const dist = Vec.dist(intersections[i], other);
      if (dist < bestDist) {
        bestDist = dist;
        bestIntersection = intersections[i];
      }
    }

    // The intersection PointLocation already carries an appropriate tangent
    // from the shape's getLineIntersections (polygon tangent for Rect/Diamond,
    // ellipse normal-derived tangent for Ellipse), which the connector
    // routing engine uses for orthogonal/curve path computation.
    return bestIntersection;
  }

  // Fallback: use getNearestPoint on shape boundary from the other endpoint
  const nearest = connectable.getNearestPoint(other);
  if (nearest) {
    const relPos = bound.toRelative(nearest);
    return getConnectableRelativePosition(connectable, relPos);
  }

  return centerPoint;
}

export function isConnectorWithLabel(model: GfxModel | GfxLocalElementModel) {
  return model instanceof ConnectorElementModel && model.hasLabel();
}

export function calculateNearestLocation(
  point: IVec,
  bounds: IBound,
  locations = ConnectorEndpointLocations,
  shortestDistance = Number.POSITIVE_INFINITY
) {
  const { x, y, w, h } = bounds;
  return locations
    .map<IVec>(offset => [x + offset[0] * w, y + offset[1] * h])
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
    );
}

function rBound(ele: GfxModel, anti = false): IBound {
  const bound = Bound.deserialize(ele.xywh);
  return { ...bound, rotate: anti ? -ele.rotate : ele.rotate };
}

export function isConnectorAndBindingsAllSelected(
  connector: ConnectorElementModel | LocalConnectorElementModel,
  selected: GfxModel[]
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

export function getAnchors(ele: GfxModel, includeCenterAnchor = true) {
  const bound = Bound.deserialize(ele.xywh);
  const offset = 10;
  const anchors: { point: PointLocation; coord: IVec }[] = [];
  const rotate = ele.rotate;

  // For polygon shapes, generate anchors at each vertex and edge midpoint
  if (
    ele instanceof ShapeElementModel &&
    ele.shapeType === ShapeType.Polygon
  ) {
    const verts: number[][] = ele.vertices ?? DEFAULT_POLYGON_VERTICES;

    for (let i = 0; i < verts.length; i++) {
      const curr = verts[i];
      const next = verts[(i + 1) % verts.length];

      // CW edge direction in absolute space, with element rotation applied.
      // This matches the convention used by linePolygonIntersects / polygonGetPointTangent:
      // Vec.rot(CW_edge_direction, -π/2) yields the outward normal.
      const edx = (next[0] - curr[0]) * bound.w;
      const edy = (next[1] - curr[1]) * bound.h;
      const edLen = Math.sqrt(edx * edx + edy * edy) || 1;
      const edgeTangent: IVec = Vec.rot(
        [edx / edLen, edy / edLen],
        toRadian(rotate)
      );

      // --- Vertex anchor ---
      const vertCoord: IVec = [curr[0], curr[1]];
      const vertAbs: IVec = [
        bound.x + vertCoord[0] * bound.w,
        bound.y + vertCoord[1] * bound.h,
      ];
      const vertRotated = getPointFromBoundsWithRotation(
        { ...bound, rotate },
        vertAbs
      );
      anchors.push({
        point: new PointLocation(vertRotated, edgeTangent),
        coord: vertCoord,
      });

      // --- Edge midpoint anchor ---
      const midCoord: IVec = [
        (curr[0] + next[0]) / 2,
        (curr[1] + next[1]) / 2,
      ];
      const midAbs: IVec = [
        bound.x + midCoord[0] * bound.w,
        bound.y + midCoord[1] * bound.h,
      ];
      const midRotated = getPointFromBoundsWithRotation(
        { ...bound, rotate },
        midAbs
      );
      anchors.push({
        point: new PointLocation(midRotated, edgeTangent),
        coord: midCoord,
      });
    }

    // Center anchor at the polygon's geometric centroid (gated on the toggle).
    if (includeCenterAnchor) {
      const centroid = polygonCentroid(verts);
      const centroidAbs: IVec = [
        bound.x + centroid[0] * bound.w,
        bound.y + centroid[1] * bound.h,
      ];
      const centroidRotated = getPointFromBoundsWithRotation(
        { ...bound, rotate },
        centroidAbs
      );
      anchors.push({
        point: new PointLocation(centroidRotated),
        coord: centroid,
      });
    }
    return anchors;
  }

  (
    [
      [bound.center[0], bound.y - offset],
      [bound.center[0], bound.maxY + offset],
      [bound.x - offset, bound.center[1]],
      [bound.maxX + offset, bound.center[1]],
    ] satisfies IVec[]
  )
    .map(vec => getPointFromBoundsWithRotation({ ...bound, rotate }, vec))
    .forEach(vec => {
      const rst = ele.getLineIntersections(bound.center, vec);
      if (!rst) return;

      const originPoint = getPointFromBoundsWithRotation(
        { ...bound, rotate: -rotate },
        rst[0]
      );
      anchors.push({ point: rst[0], coord: bound.toRelative(originPoint) });
    });

  // Add center anchor for eligible shapes (Rect, roundedRect, Ellipse, Diamond, Triangle)
  if (includeCenterAnchor && isCenterAnchorEligible(ele)) {
    const centerPoint = getPointFromBoundsWithRotation(
      { ...bound, rotate },
      bound.center
    );
    const centerPointLocation = new PointLocation(centerPoint);
    anchors.push({ point: centerPointLocation, coord: [0.5, 0.5] });
  }

  return anchors;
}

function getConnectableRelativePosition(connectable: GfxModel, position: IVec) {
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

export function getNearestConnectableAnchor(
  ele: Connectable,
  point: IVec,
  includeCenterAnchor = true
) {
  const anchors = getAnchors(ele, includeCenterAnchor);
  return closestPoint(
    anchors.map(a => a.point),
    point
  );
}

function closestPoint(
  points: PointLocation[],
  point: IVec
): PointLocation | null {
  if (points.length === 0) return null;
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
    return !bound.isPointInBound([point[0], point[1]]);
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
    ]
      .map(line => {
        return lineIntersects(
          [point[0], point[1]],
          [point[0], point[1] + 1],
          line[0],
          line[1],
          true
        );
      })
      .filter(p => p !== null);
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
    ]
      .map(line => {
        return lineIntersects(
          [point[0], point[1]],
          [point[0] + 1, point[1]],
          line[0],
          line[1],
          true
        );
      })
      .filter(p => p !== null);
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
    [startPoint[0], startPoint[1]],
    [endPoint[0], endPoint[1]],
  ]);
  const outerBound =
    expandStartBound &&
    expandEndBound &&
    expandStartBound.unite(expandEndBound);
  let points = [nextStartPoint, lastEndPoint];
  pushWithPriority(points, lineBound.getVerticesAndMidpoints());

  if (!startBound || !endBound) {
    pushWithPriority(points, [lineBound.center], 3);
  }
  if (outerBound) {
    pushOuterPoints(points, expandStartBound, expandEndBound, outerBound);
  }

  if (startBound && endBound && expandStartBound && expandEndBound) {
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
      expandStartBound.include([lastEndPoint[0], lastEndPoint[1]]).points
    );
  }

  if (expandEndBound) {
    pushWithPriority(points, expandEndBound.getVerticesAndMidpoints());
    pushWithPriority(
      points,
      expandEndBound.include([nextStartPoint[0], nextStartPoint[1]]).points
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
  });
  if (!startEnds[0] || !startEnds[1]) {
    throw new BlockSuiteError(
      BlockSuiteError.ErrorCode.ValueNotExists,
      'Failed to get start and end points when getting connectable points'
    );
  }
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
  if (points.length !== 0) {
    result.push([points[points.length - 1][0], points[points.length - 1][1]]);
  }
  for (let i = 0; i < result.length - 1; i++) {
    const cur = result[i];
    const next = result[i + 1];
    const isAlmostEqual =
      almostEqual(cur[0], next[0], 0.02) || almostEqual(cur[1], next[1], 0.02);
    if (!isAlmostEqual) {
      console.warn('Expected equal points');
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
  const result: IVec = [point[0], point[1]];
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
        if (!intersects) {
          throw new BlockSuiteError(
            BlockSuiteError.ErrorCode.ValueNotExists,
            'Failed to get line intersections for getNextPoint'
          );
        }
        result[0] = intersects[0] + offsetX;
      } else {
        const intersects = lineIntersects(
          bound.leftLine[0],
          bound.leftLine[1],
          result,
          [bound.x - 10, result[1]]
        );
        if (!intersects) {
          throw new BlockSuiteError(
            BlockSuiteError.ErrorCode.ValueNotExists,
            'Failed to get line intersections for getNextPoint'
          );
        }
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
        if (!intersects) {
          throw new BlockSuiteError(
            BlockSuiteError.ErrorCode.ValueNotExists,
            'Failed to get line intersections for getNextPoint'
          );
        }
        result[1] = intersects[1] + offsetY;
      } else {
        const intersects = lineIntersects(
          bound.upperLine[0],
          bound.upperLine[1],
          result,
          [result[0], bound.y - 10]
        );
        if (!intersects) {
          throw new BlockSuiteError(
            BlockSuiteError.ErrorCode.ValueNotExists,
            'Failed to get line intersections for getNextPoint'
          );
        }
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
  static override overlayName = 'connection';

  private _emphasisColor: string;

  private _themeDisposer: (() => void) | null = null;

  highlightPoint: IVec | null = null;

  points: IVec[] = [];

  sourceBounds: IBound | null = null;

  targetBounds: IBound | null = null;

  /**
   * Checks whether the center anchor toggle is enabled.
   * Returns true (enabled) by default if no stored value is found.
   */
  get centerAnchorEnabled(): boolean {
    const store = this.gfx.std.getOptional(EditPropsStore);
    if (!store) return true;
    const value = store.getStorage('connectorCenterAnchor');
    return value ?? true;
  }

  constructor(gfx: GfxController) {
    super(gfx);
    this._emphasisColor = this._getEmphasisColor();
    this._setupThemeListener();
  }

  private _findConnectablesInViews() {
    const gfx = this.gfx;
    const bound = gfx.viewport.viewportBounds;
    return gfx.getElementsByBound(bound).filter(ele => ele.connectable);
  }

  private _getEmphasisColor(): string {
    return getComputedStyle(this.gfx.std.host).getPropertyValue(
      '--affine-text-emphasis-color'
    );
  }

  private _setupThemeListener(): void {
    const themeService = this.gfx.std.get(ThemeProvider);
    this._themeDisposer = effect(() => {
      themeService.theme$;
      this._emphasisColor = this._getEmphasisColor();
    });
  }

  _clearRect() {
    this.points = [];
    this.highlightPoint = null;
    this._renderer?.refresh();
  }

  override clear() {
    this.sourceBounds = null;
    this.targetBounds = null;
    this._clearRect();
  }

  override dispose() {
    this._themeDisposer?.();
    if (!this._renderer) return;
    this._renderer.removeOverlay(this);
    this._renderer = null;
  }

  override render(ctx: CanvasRenderingContext2D): void {
    const zoom = this.gfx.viewport.zoom;
    const radius = 5 / zoom;
    const color = this._emphasisColor;
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
    const context = this.gfx;
    const target = [];

    this._clearRect();

    let result: Connection | null = null;
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < connectables.length; i++) {
      const connectable = connectables[i];
      // first check if in excluedIds
      if (excludedIds.includes(connectable.id)) continue;

      // then check if in expanded bound
      const bound = Bound.deserialize(connectable.xywh);
      const rotateBound = Bound.from(getBoundWithRotation(rBound(connectable)));
      // FIXME: the real path needs to be expanded: diamod, ellipse, trangle.
      if (!rotateBound.expand(10).isPointInBound(point)) continue;

      // then check if closes to anchors
      const anchors = getAnchors(connectable, this.centerAnchorEnabled);
      const len = anchors.length;
      const pointerViewCoord = context.viewport.toViewCoord(point[0], point[1]);

      let shortestDistance = Number.POSITIVE_INFINITY;
      let j = 0;

      this.points = anchors.map(a => a.point);

      for (; j < len; j++) {
        const anchor = anchors[j];
        const anchorViewCoord = context.viewport.toViewCoord(
          anchor.point[0],
          anchor.point[1]
        );
        const d = Vec.dist(anchorViewCoord, pointerViewCoord);
        if (d < shortestDistance) {
          shortestDistance = d;
          target.push(connectable);
          this.highlightPoint = anchor.point;
          result = {
            id: connectable.id,
            position: anchor.coord,
          };
        }
      }

      if (shortestDistance < 8 && result) break;

      // if not, check if closes to bound
      const nearestPoint = connectable.getNearestPoint(point);

      if (Vec.dist(nearestPoint, point) < 8) {
        this.highlightPoint = nearestPoint;
        const originPoint = getPointFromBoundsWithRotation(
          rBound(connectable, true),
          nearestPoint
        );
        this._renderer?.refresh();
        target.push(connectable);
        result = {
          id: connectable.id,
          position: Vec.clampV(bound.toRelative(originPoint), 0, 1),
        };
      }

      if (result) continue;

      // if not, check if in inside of the element
      if (
        connectable.includesPoint(
          point[0],
          point[1],
          {
            ignoreTransparent: false,
          },
          this.gfx.std.host
        )
      ) {
        target.push(connectable);
        result = {
          id: connectable.id,
        };
      }
    }

    if (last(target) instanceof GroupElementModel) {
      this.targetBounds = Bound.deserialize(last(target)!.xywh);
    } else {
      this.targetBounds = null;
    }

    // at last, if not, just return the point
    if (!result) {
      result = {
        position: point,
      };
    }

    this._renderer?.refresh();

    return result;
  }
}

export class PathGenerator {
  protected _aStarRunner: AStarRunner | null = null;

  protected _prepareOrthogonalConnectorInfo(
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
}

export class ConnectorPathGenerator extends PathGenerator {
  constructor(
    private readonly options: {
      getElementById: (id: string) => GfxModel | null;
    }
  ) {
    super();
  }

  static updatePath(
    connector: ConnectorElementModel | LocalConnectorElementModel,
    path: PointLocation[] | null,
    elementGetter?: (id: string) => GfxModel | null
  ) {
    const instance = new ConnectorPathGenerator({
      getElementById: elementGetter ?? (() => null),
    });

    const points = path ?? instance._generateConnectorPath(connector) ?? [];
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

  private _computeStartEndPoint(
    connector: ConnectorElementModel | LocalConnectorElementModel
  ) {
    const { source, target } = connector;
    const start = this._getConnectorEndElement(connector, 'source');
    const end = this._getConnectorEndElement(connector, 'target');

    let startPoint: PointLocation | null = null;
    let endPoint: PointLocation | null = null;
    if (
      source.id &&
      !source.position &&
      target.id &&
      !target.position &&
      start &&
      end
    ) {
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

    if (!startPoint || !endPoint) return [];

    // Adjust center-anchored endpoints to perimeter
    return this._adjustCenterAnchorEndpoints(connector, startPoint, endPoint);
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
        ? Bound.from(getBoundWithRotation(rBound(start)))
        : null;
      const endBound = end
        ? Bound.from(getBoundWithRotation(rBound(end)))
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
    let startPoint: PointLocation | null = null;
    let endPoint: PointLocation | null = null;

    if (source.id || target.id) {
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

      if (!startPoint || !endPoint) return [];

      // Adjust center-anchored endpoints to perimeter before computing
      // control vectors, so tangent and position are correct
      [startPoint, endPoint] = this._adjustCenterAnchorEndpoints(
        connector,
        startPoint,
        endPoint
      );

      if (source.id) {
        const startTangentVertical = Vec.rot(startPoint.tangent, -Math.PI / 2);
        startPoint.out = isVecZero(startTangentVertical)
          ? Vec.mul(Vec.per(Vec.normalize(Vec.sub(startPoint, endPoint))), 20)
          : Vec.mul(
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
        endPoint.in = isVecZero(endTangentVertical)
          ? Vec.mul(Vec.per(Vec.normalize(Vec.sub(endPoint, startPoint))), 20)
          : Vec.mul(
              endTangentVertical,
              Math.max(
                100,
                Math.abs(
                  Vec.pry(Vec.sub(startPoint, endPoint), endTangentVertical)
                ) / 3
              )
            );
      }
      return this._applyCurveControlPoint(connector, startPoint, endPoint);
    } else {
      startPoint = this._getConnectionPoint(connector, 'source');
      endPoint = this._getConnectionPoint(connector, 'target');

      if (!startPoint || !endPoint) return [];

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
      return this._applyCurveControlPoint(connector, startPoint, endPoint);
    }
  }

  /**
   * If the connector has a curveControlPoint, recalculate absIn/absOut so the
   * cubic Bézier passes exactly through the control point at t = 0.5.
   *
   * Given endpoints P0 (start) and P3 (end), and desired passthrough C:
   *   P1 = (4C − P3) / 3          →  startPoint.out = P1 − P0
   *   P2 = (4C − P0) / 3          →  endPoint.in    = P2 − P3
   *
   * Proof: B(0.5) = (P0 + 3P1 + 3P2 + P3)/8
   *               = (P0 + (4C−P3) + (4C−P0) + P3)/8 = 8C/8 = C  ✓
   */
  private _applyCurveControlPoint(
    connector: ConnectorElementModel | LocalConnectorElementModel,
    startPoint: PointLocation,
    endPoint: PointLocation
  ): PointLocation[] {
    if (
      connector instanceof ConnectorElementModel &&
      connector.curveControlPoint
    ) {
      const C = connector.curveControlPoint;
      const P0: IVec = [startPoint[0], startPoint[1]];
      const P3: IVec = [endPoint[0], endPoint[1]];

      // out = P1 - P0 = (4C - P3 - 3P0) / 3
      startPoint.out = Vec.div(
        Vec.sub(Vec.sub(Vec.mul(C, 4), P3), Vec.mul(P0, 3)),
        3
      );

      // in = P2 - P3 = (4C - P0 - 3P3) / 3
      endPoint.in = Vec.div(
        Vec.sub(Vec.sub(Vec.mul(C, 4), P0), Vec.mul(P3, 3)),
        3
      );
    }
    return [startPoint, endPoint];
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
      if (!startPoint || !endPoint) return [];
      const [adjStart, adjEnd] = this._adjustCenterAnchorEndpoints(
        connector,
        startPoint,
        endPoint
      );
      return [adjStart, adjEnd];
    } else {
      const endPoint = this._getConnectionPoint(connector, 'target');
      const startPoint = this._getConnectionPoint(connector, 'source');
      if (!startPoint || !endPoint) return [];
      const [adjStart, adjEnd] = this._adjustCenterAnchorEndpoints(
        connector,
        startPoint,
        endPoint
      );
      return [adjStart, adjEnd];
    }
  }

  /**
   * Adjusts connector endpoints so that center-anchored endpoints visually
   * terminate at the shape perimeter rather than at the center.
   *
   * For each endpoint, checks if the logical anchor is the center point
   * [0.5, 0.5] on a center-eligible shape. If so, computes the perimeter
   * intersection from the opposite endpoint toward the center, and replaces
   * the endpoint with the perimeter point.
   */
  private _adjustCenterAnchorEndpoints(
    connector: ConnectorElementModel | LocalConnectorElementModel,
    startPoint: PointLocation,
    endPoint: PointLocation
  ): [PointLocation, PointLocation] {
    const { source, target } = connector;
    const start = this._getConnectorEndElement(connector, 'source');
    const end = this._getConnectorEndElement(connector, 'target');

    let adjustedStart = startPoint;
    let adjustedEnd = endPoint;

    // Check if source is center-anchored
    if (start && source.id && isCenterAnchorEligible(start)) {
      const isCenter = source.position
        ? isCenterAnchorPosition(source.position, start)
        : this._isPointAtShapeCenter(start, startPoint);
      if (isCenter) {
        adjustedStart = computePerimeterPointForCenterAnchor(
          start,
          startPoint,
          endPoint
        );
      }
    }

    // Check if target is center-anchored
    if (end && target.id && isCenterAnchorEligible(end)) {
      const isCenter = target.position
        ? isCenterAnchorPosition(target.position, end)
        : this._isPointAtShapeCenter(end, endPoint);
      if (isCenter) {
        adjustedEnd = computePerimeterPointForCenterAnchor(
          end,
          endPoint,
          // Use adjusted start if it was modified, for accurate direction
          adjustedStart
        );
      }
    }

    return [adjustedStart, adjustedEnd];
  }

  /**
   * Checks if a PointLocation is at the center of a shape (for detecting
   * auto-selected center anchors when no explicit position is set).
   */
  private _isPointAtShapeCenter(
    connectable: GfxModel,
    point: PointLocation
  ): boolean {
    const bound = Bound.deserialize(connectable.xywh);
    const center = getPointFromBoundsWithRotation(
      { ...bound, rotate: connectable.rotate },
      bound.center
    );
    return (
      almostEqual(point[0], center[0], 1) &&
      almostEqual(point[1], center[1], 1)
    );
  }

  private _getConnectionPoint(
    connector: ConnectorElementModel | LocalConnectorElementModel,
    type: 'source' | 'target'
  ): PointLocation | null {
    const connection = connector[type];

    if (!connection) return null;

    const connectable = this._getConnectorEndElement(connector, type);

    if (!connectable && connection.position) {
      return PointLocation.fromVec(connection.position);
    }

    if (!connectable) return null;

    let point: PointLocation | null = null;

    if (connection.position) {
      point = getConnectableRelativePosition(connectable, connection.position);
    } else {
      const anotherType = type === 'source' ? 'target' : 'source';
      const otherPoint = this._getConnectionPoint(connector, anotherType);
      if (otherPoint) {
        point = getNearestConnectableAnchor(connectable, otherPoint);
      }
    }

    return point;
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
}
