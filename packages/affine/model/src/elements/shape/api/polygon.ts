import type { IBound, IVec } from '@blocksuite/global/gfx';
import {
  Bound,
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
const DEFAULT_POLYGON_VERTICES: number[][] = [
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
   * Hit-testing is performed in two passes:
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

    // Pass 1: stroke hit-test (scaled by zoom so the threshold is constant
    // in screen pixels regardless of the current viewport zoom level).
    let hit = pointOnPolygonStoke(
      point,
      points,
      (options?.hitThreshold ?? 1) / (options?.zoom ?? 1)
    );

    if (!hit) {
      // Pass 2: winding-number interior test.  This replaces any naïve
      // axis-aligned bounding-box containment check and correctly handles
      // concave polygons — a point inside the bounding box but inside a
      // concave notch is correctly reported as NOT a hit.
      hit = pointInPolygon([x, y], points);
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
};
