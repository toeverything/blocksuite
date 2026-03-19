import type { IBound, IVec } from '@blocksuite/global/gfx';
import {
  Bound,
  getCenterAreaBounds,
  getPointsFromBoundWithRotation,
  linePolygonIntersects,
  pointInPolygon,
  PointLocation,
  pointOnPolygonStoke,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
} from '@blocksuite/global/gfx';
import type { PointTestOptions } from '@blocksuite/std/gfx';

import { DEFAULT_CENTRAL_AREA_RATIO } from '../../../consts/index.js';
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

  includesPoint(
    this: ShapeElementModel,
    x: number,
    y: number,
    options: PointTestOptions
  ) {
    const point: IVec = [x, y];
    const pointsFn = getPolygonVertices(this);
    const points = getPointsFromBoundWithRotation(this, pointsFn);

    let hit = pointOnPolygonStoke(
      point,
      points,
      (options?.hitThreshold ?? 1) / (options?.zoom ?? 1)
    );

    if (!hit) {
      if (!options.ignoreTransparent || this.filled) {
        hit = pointInPolygon([x, y], points);
      } else {
        // If shape is not filled or transparent
        const text = this.text;
        if (!text || !text.length) {
          // Check the center area of the shape
          const centralBounds = getCenterAreaBounds(
            this,
            DEFAULT_CENTRAL_AREA_RATIO
          );
          const centralPoints = getPointsFromBoundWithRotation(
            centralBounds,
            pointsFn
          );
          hit = pointInPolygon([x, y], centralPoints);
        } else if (this.textBound) {
          hit = pointInPolygon(
            point,
            getPointsFromBoundWithRotation(
              this,
              () => Bound.from(this.textBound!).points
            )
          );
        }
      }
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

    points = rotatePoints(points, bound.center, element.rotate);
    const rotatePoint = points.pop() as IVec;
    const tangent = polygonGetPointTangent(points, rotatePoint);
    return new PointLocation(rotatePoint, tangent);
  },
};
