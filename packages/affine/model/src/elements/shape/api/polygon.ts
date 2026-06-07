import type { IBound, IVec } from '@blocksuite/global/gfx';
import {
  Bound,
  type BezierCurveParameters,
  getBezierCurveBoundingBox,
  getPointsFromBoundWithRotation,
  linePolygonIntersects,
  pointInPolygon,
  PointLocation,
  pointOnPolygonStoke,
  polygonGetPointTangent,
  polygonNearestPoint,
  polygonNearestPointAndTangent,
  rotatePoints,
} from '@blocksuite/global/gfx';
import type { PointTestOptions } from '@blocksuite/std/gfx';
import type { ShapeElementModel } from '../shape.js';

/**
 * Default polygon vertices (a regular pentagon) used when no custom vertices
 * are provided. Stored as normalized [0-1] coordinates relative to the
 * bounding box.
 */
export const DEFAULT_POLYGON_VERTICES: number[][] = [
  [0.5, 0],
  [1, 0.38],
  [0.81, 1],
  [0.19, 1],
  [0, 0.38],
];

/**
 * Returns the absolute points for a polygon shape given its bound and vertices.
 * If the element has custom vertices, they are denormalized from [0-1] space
 * to the actual bounding box coordinates. Otherwise, the default pentagon
 * vertices are used.
 */
function getPolygonVertices(
  element: ShapeElementModel | { vertices?: number[][] | null }
): (bound: IBound) => IVec[] {
  const verts =
    'vertices' in element && element.vertices
      ? element.vertices
      : DEFAULT_POLYGON_VERTICES;

  return ({ x, y, w, h }: IBound): IVec[] => {
    return verts.map(v => [x + v[0] * w, y + v[1] * h]);
  };
}

/**
 * Compute a tight bounding box that encompasses all polygon geometry
 * including Bezier curve arcs and control handles. Uses
 * getBezierCurveBoundingBox from curve.ts for arc bound computation.
 *
 * Returns null if the element has no Bezier curves (plain polygon).
 */
function computeBezierAwareBound(
  element: ShapeElementModel
): Bound | null {
  const vertices = element.vertices;
  if (!vertices || vertices.length < 2) return null;

  const smoothFlags = element.smoothFlags;
  if (!smoothFlags || !smoothFlags.some(f => f)) return null;

  const bound = Bound.deserialize(element.xywh);
  const count = vertices.length;

  // Start with vertex positions
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  const absVerts: [number, number][] = vertices.map(v => {
    const ax = bound.x + v[0] * bound.w;
    const ay = bound.y + v[1] * bound.h;
    if (ax < minX) minX = ax;
    if (ay < minY) minY = ay;
    if (ax > maxX) maxX = ax;
    if (ay > maxY) maxY = ay;
    return [ax, ay];
  });

  const controlPoints = element.controlPoints;

  // For each edge, compute the Bezier curve bounding box
  for (let i = 0; i < count; i++) {
    const next = (i + 1) % count;
    const currSmooth = smoothFlags[i] ?? false;
    const nextSmooth = smoothFlags[next] ?? false;

    if (!currSmooth && !nextSmooth) continue;

    const [cx, cy] = absVerts[i];
    const [nx, ny] = absVerts[next];

    // Outgoing control point of current vertex
    let cp1x: number, cp1y: number;
    const customCurr = controlPoints?.[i];
    if (currSmooth) {
      cp1x = customCurr
        ? customCurr[2] * bound.w + bound.x
        : cx + (nx - cx) / 3;
      cp1y = customCurr
        ? customCurr[3] * bound.h + bound.y
        : cy + (ny - cy) / 3;
    } else {
      cp1x = cx;
      cp1y = cy;
    }

    // Incoming control point of next vertex
    let cp2x: number, cp2y: number;
    const customNext = controlPoints?.[next];
    if (nextSmooth) {
      cp2x = customNext
        ? customNext[0] * bound.w + bound.x
        : nx + (cx - nx) / 3;
      cp2y = customNext
        ? customNext[1] * bound.h + bound.y
        : ny + (cy - ny) / 3;
    } else {
      cp2x = nx;
      cp2y = ny;
    }

    // Include control handle positions
    if (cp1x < minX) minX = cp1x;
    if (cp1y < minY) minY = cp1y;
    if (cp1x > maxX) maxX = cp1x;
    if (cp1y > maxY) maxY = cp1y;
    if (cp2x < minX) minX = cp2x;
    if (cp2y < minY) minY = cp2y;
    if (cp2x > maxX) maxX = cp2x;
    if (cp2y > maxY) maxY = cp2y;

    // Use getBezierCurveBoundingBox to compute tight arc bounds
    const bezierParams: BezierCurveParameters = [
      [cx, cy],
      [cp1x, cp1y],
      [cp2x, cp2y],
      [nx, ny],
    ];
    const arcBound = getBezierCurveBoundingBox(bezierParams);
    if (arcBound.x < minX) minX = arcBound.x;
    if (arcBound.y < minY) minY = arcBound.y;
    if (arcBound.x + arcBound.w > maxX) maxX = arcBound.x + arcBound.w;
    if (arcBound.y + arcBound.h > maxY) maxY = arcBound.y + arcBound.h;
  }

  return new Bound(minX, minY, maxX - minX, maxY - minY);
}

/**
 * Check whether a point is near any Bezier control handle or on a Bezier
 * curve arc for a polygon with smooth vertices. Used by includesPoint to
 * prevent deselection when clicking on control handles or curve arcs that
 * extend beyond the polygon body.
 *
 * Returns true if the point is within hitThreshold of a control handle or
 * within hitThreshold of a point on any Bezier curve arc.
 */
function pointOnBezierGeometry(
  element: ShapeElementModel,
  px: number,
  py: number,
  hitThreshold: number
): boolean {
  const vertices = element.vertices;
  if (!vertices || vertices.length < 2) return false;

  const smoothFlags = element.smoothFlags;
  if (!smoothFlags || !smoothFlags.some(f => f)) return false;

  const bound = Bound.deserialize(element.xywh);
  const controlPoints = element.controlPoints;
  const count = vertices.length;
  const hitDistSq = hitThreshold * hitThreshold;

  const absVerts: [number, number][] = vertices.map(v => [
    bound.x + v[0] * bound.w,
    bound.y + v[1] * bound.h,
  ]);

  for (let i = 0; i < count; i++) {
    const next = (i + 1) % count;
    const currSmooth = smoothFlags[i] ?? false;
    const nextSmooth = smoothFlags[next] ?? false;

    if (!currSmooth && !nextSmooth) continue;

    const [cx, cy] = absVerts[i];
    const [nx, ny] = absVerts[next];

    // Outgoing control point of current vertex
    let cp1x: number, cp1y: number;
    const customCurr = controlPoints?.[i];
    if (currSmooth) {
      cp1x = customCurr
        ? customCurr[2] * bound.w + bound.x
        : cx + (nx - cx) / 3;
      cp1y = customCurr
        ? customCurr[3] * bound.h + bound.y
        : cy + (ny - cy) / 3;
    } else {
      cp1x = cx;
      cp1y = cy;
    }

    // Incoming control point of next vertex
    let cp2x: number, cp2y: number;
    const customNext = controlPoints?.[next];
    if (nextSmooth) {
      cp2x = customNext
        ? customNext[0] * bound.w + bound.x
        : nx + (cx - nx) / 3;
      cp2y = customNext
        ? customNext[1] * bound.h + bound.y
        : ny + (cy - ny) / 3;
    } else {
      cp2x = nx;
      cp2y = ny;
    }

    // Check proximity to control handle positions
    const dxCp1 = px - cp1x;
    const dyCp1 = py - cp1y;
    if (dxCp1 * dxCp1 + dyCp1 * dyCp1 <= hitDistSq) return true;

    const dxCp2 = px - cp2x;
    const dyCp2 = py - cp2y;
    if (dxCp2 * dxCp2 + dyCp2 * dyCp2 <= hitDistSq) return true;

    // Check proximity to the Bezier curve arc by sampling points along the
    // cubic Bezier and testing distance to the closest sample.
    // Use ~20 samples per segment for reasonable precision.
    const steps = 20;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const t2 = t * t;
      // Cubic Bezier: B(t) = (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
      const bx =
        mt2 * mt * cx +
        3 * mt2 * t * cp1x +
        3 * mt * t2 * cp2x +
        t2 * t * nx;
      const by =
        mt2 * mt * cy +
        3 * mt2 * t * cp1y +
        3 * mt * t2 * cp2y +
        t2 * t * ny;
      const dbx = px - bx;
      const dby = py - by;
      if (dbx * dbx + dby * dby <= hitDistSq) return true;
    }
  }

  return false;
}

export const polygon = {
  points(bound: IBound, element?: ShapeElementModel): IVec[] {
    const verts =
      element?.vertices ?? DEFAULT_POLYGON_VERTICES;
    const { x, y, w, h } = bound;
    return verts.map(v => [x + v[0] * w, y + v[1] * h]);
  },

  draw(
    ctx: CanvasRenderingContext2D,
    { x, y, w, h, rotate = 0 }: IBound,
    vertices?: number[][] | null
  ) {
    const verts = vertices ?? DEFAULT_POLYGON_VERTICES;
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    ctx.beginPath();
    const absPoints = verts.map(v => [x + v[0] * w, y + v[1] * h]);
    if (absPoints.length > 0) {
      ctx.moveTo(absPoints[0][0], absPoints[0][1]);
      for (let i = 1; i < absPoints.length; i++) {
        ctx.lineTo(absPoints[i][0], absPoints[i][1]);
      }
    }
    ctx.closePath();

    ctx.restore();
  },

  /**
   * Determines whether the given model-space point `(x, y)` is considered
   * a "hit" on this polygon shape.
   *
   * Hit-testing is performed in three passes:
   *
   * 1. **Stroke pass** – `pointOnPolygonStoke` checks whether the point lies
   *    within `hitThreshold / zoom` model units of any polygon edge.  This
   *    enables selecting a polygon by clicking on its visible outline.
   *
   * 2. **Interior pass** – `pointInPolygon` uses the **winding-number
   *    algorithm** to decide whether the point falls inside the filled area.
   *    Unlike a bounding-box check, the winding-number algorithm correctly
   *    classifies points in the concave "notches" of non-convex polygons as
   *    outside, and all points inside the true polygon boundary as inside.
   *    This is what makes drag-to-move work from anywhere in the visible
   *    polygon body regardless of the shape's convexity.
   *
   * 3. **Bezier geometry pass** – when the polygon has smooth vertices with
   *    Bezier curves, checks whether the point is near a control handle or
   *    on a Bezier curve arc. This prevents deselection when clicking on
   *    control handles that extend beyond the polygon body.
   *
   * Rotation is handled transparently: `getPointsFromBoundWithRotation`
   * returns the polygon's absolute vertex positions already transformed by
   * the element's `rotate` angle, so both `x`/`y` and `points` are expressed
   * in the same (model) coordinate space.
   *
   * Note: unlike `rect` / `ellipse` which skip the interior check for
   * transparent/unfilled shapes, polygon always tests the interior — a
   * freeform polygon is always interactable regardless of fill settings.
   */
  includesPoint(
    this: ShapeElementModel,
    x: number,
    y: number,
    options: PointTestOptions
  ) {
    const point: IVec = [x, y];
    const pointsFn = getPolygonVertices(this);
    // Apply rotation transformation so vertices are in the same model-space
    // coordinate system as the incoming (x, y) hit-test point.
    const points = getPointsFromBoundWithRotation(this, pointsFn);

    const hitThreshold = (options?.hitThreshold ?? 1) / (options?.zoom ?? 1);

    // Pass 1: stroke hit-test (scaled by zoom so the threshold is constant
    // in screen pixels regardless of the current viewport zoom level).
    let hit = pointOnPolygonStoke(
      point,
      points,
      hitThreshold
    );

    if (!hit) {
      // Pass 2: winding-number interior test.  This replaces any naïve
      // axis-aligned bounding-box containment check and correctly handles
      // concave polygons — a point inside the bounding box but inside a
      // concave notch is correctly reported as NOT a hit.
      hit = pointInPolygon([x, y], points);
    }

    if (!hit) {
      // Pass 3: Bezier geometry hit-test — check control handles and curve
      // arcs so the polygon doesn't deselect when clicking on Bezier
      // geometry that extends beyond the polygon body.
      hit = pointOnBezierGeometry(this, x, y, hitThreshold);
    }

    return hit;
  },

  containsBound(bounds: Bound, element: ShapeElementModel): boolean {
    const pointsFn = getPolygonVertices(element);
    const points = getPointsFromBoundWithRotation(element, pointsFn);
    return points.some(point => bounds.containsPoint(point));
  },

  getNearestPoint(point: IVec, element: ShapeElementModel) {
    const pointsFn = getPolygonVertices(element);
    const points = getPointsFromBoundWithRotation(element, pointsFn);
    return polygonNearestPoint(points, point);
  },

  getLineIntersections(start: IVec, end: IVec, element: ShapeElementModel) {
    const pointsFn = getPolygonVertices(element);
    const points = getPointsFromBoundWithRotation(element, pointsFn);
    return linePolygonIntersects(start, end, points);
  },

  getRelativePointLocation(position: IVec, element: ShapeElementModel) {
    const bound = Bound.deserialize(element.xywh);
    const point = bound.getRelativePoint(position);
    const verts = element.vertices ?? DEFAULT_POLYGON_VERTICES;
    let points: IVec[] = verts.map(v => [
      bound.x + v[0] * bound.w,
      bound.y + v[1] * bound.h,
    ]);
    points.push(point);

    // Rotate everything together (same pattern as diamond/triangle)
    points = rotatePoints(points, bound.center, element.rotate);
    const rotatePoint = points.pop() as IVec;

    // Try exact edge tangent first (works when BB point lands on a polygon edge)
    let tangent = polygonGetPointTangent(points, rotatePoint);

    // For freeform polygons, the BB point rarely sits on an edge.
    // Fall back to nearest-edge tangent for proper curve shaping.
    if (tangent[0] === 0 && tangent[1] === 0) {
      tangent = polygonNearestPointAndTangent(points, rotatePoint).tangent;
    }

    return new PointLocation(rotatePoint, tangent);
  },

  /**
   * Compute the element bound for a polygon, expanded to include Bezier
   * curve arcs and control handles when present. Returns the standard
   * xywh bound for plain polygons without Bezier curves.
   */
  elementBound(element: ShapeElementModel): Bound {
    return computeBezierAwareBound(element) ?? Bound.deserialize(element.xywh);
  },
};
