import {
  DEFAULT_CENTRAL_AREA_RATIO,
  type IBound,
  ShapeStyle,
  StrokeStyle,
} from '../../../consts.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import { Bound } from '../../../utils/bound.js';
import {
  getCenterAreaBounds,
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  pointInPolygon,
  pointOnPolygonStoke,
  polygonGetPointTangent,
  polygonNearestPoint,
  rotatePoints,
} from '../../../utils/math-utils.js';
import { PointLocation } from '../../../utils/point-location.js';
import { type IVec } from '../../../utils/vec.js';
import type { HitTestOptions } from '../../edgeless-element.js';
import type { ShapeElement } from '../shape-element.js';
import type { ShapeMethods } from '../types.js';
import { drawGeneralShape, hitTestOnShapeText } from '../utils.js';

/* "magic number" for bezier approximations of arcs (http://itc.ktu.lt/itc354/Riskus354.pdf) */
const kRect = 1 - 0.5522847498;

export const RectMethods: ShapeMethods = {
  points({ x, y, w, h }: IBound) {
    return [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ];
  },
  render(
    ctx: CanvasRenderingContext2D,
    matrix: DOMMatrix,
    rc: RoughCanvas,
    element: ShapeElement
  ) {
    const {
      seed,
      strokeWidth,
      filled,
      realFillColor,
      realStrokeColor,
      radius,
      strokeStyle,
      roughness,
      rotate,
      shapeStyle,
    } = element;
    const [, , w, h] = element.deserializeXYWH();
    const renderOffset = Math.max(strokeWidth, 0) / 2;
    const renderWidth = w - renderOffset * 2;
    const renderHeight = h - renderOffset * 2;
    const r = Math.min(renderWidth * radius, renderHeight * radius);
    const cx = renderWidth / 2;
    const cy = renderHeight / 2;

    ctx.setTransform(
      matrix
        .translateSelf(renderOffset, renderOffset)
        .translateSelf(cx, cy)
        .rotateSelf(rotate)
        .translateSelf(-cx, -cy)
    );

    if (shapeStyle === ShapeStyle.General) {
      drawGeneralShape(ctx, 'rect', {
        x: 0,
        y: 0,
        width: renderWidth,
        height: renderHeight,
        strokeWidth,
        strokeColor: realStrokeColor,
        strokeStyle: strokeStyle,
        fillColor: realFillColor,
        radius,
      });
    } else {
      rc.path(
        `
        M ${r} 0
        L ${renderWidth - r} 0
        C ${renderWidth - kRect * r} 0 ${renderWidth} ${
          kRect * r
        } ${renderWidth} ${r}
        L ${renderWidth} ${renderHeight - r}
        C ${renderWidth} ${renderHeight - kRect * r} ${
          renderWidth - kRect * r
        } ${renderHeight} ${renderWidth - r} ${renderHeight}
        L ${r} ${renderHeight}
        C ${kRect * r} ${renderHeight} 0 ${renderHeight - kRect * r} 0 ${
          renderHeight - r
        }
        L 0 ${r}
        C 0 ${kRect * r} ${kRect * r} 0 ${r} 0
        Z
        `,
        {
          seed,
          roughness: shapeStyle === ShapeStyle.Scribbled ? roughness : 0,
          strokeLineDash:
            strokeStyle === StrokeStyle.Dashed ? [12, 12] : undefined,
          stroke: strokeStyle === StrokeStyle.None ? 'none' : realStrokeColor,
          strokeWidth,
          fill: filled ? realFillColor : undefined,
        }
      );
    }
  },

  hitTest(this: ShapeElement, x: number, y: number, options: HitTestOptions) {
    const points = getPointsFromBoundsWithRotation(this);

    let hit = pointOnPolygonStoke(
      [x, y],
      points,
      (options?.expand ?? 1) / (this.renderer?.zoom ?? 1)
    );

    if (!hit) {
      // If the point is not on the stroke, check if it is in the shape
      // When the shape is filled and transparent is not ignored
      if (!options.ignoreTransparent || this.filled) {
        hit = pointInPolygon([x, y], points);
      } else {
        // If shape is not filled or transparent
        // Check if hit the text area
        const text = this.text;
        if (!text || !text.length) {
          // if not, check the default center area of the shape
          const centralBounds = getCenterAreaBounds(
            this,
            DEFAULT_CENTRAL_AREA_RATIO
          );
          const centralPoints = getPointsFromBoundsWithRotation(centralBounds);
          // Check if the point is in the center area
          hit = pointInPolygon([x, y], centralPoints);
        } else {
          hit = hitTestOnShapeText([x, y], this);
        }
      }
    }

    return hit;
  },

  containedByBounds(bounds: Bound, element: ShapeElement): boolean {
    const points = getPointsFromBoundsWithRotation(element);
    return points.some(point => bounds.containsPoint(point));
  },

  getNearestPoint(point: IVec, element: ShapeElement) {
    const points = getPointsFromBoundsWithRotation(element);
    return polygonNearestPoint(points, point);
  },

  intersectWithLine(start: IVec, end: IVec, element: ShapeElement) {
    const points = getPointsFromBoundsWithRotation(element);
    return linePolygonIntersects(start, end, points);
  },

  getRelativePointLocation(relativePoint, element) {
    const bound = Bound.deserialize(element.xywh);
    const point = bound.getRelativePoint(relativePoint);
    const rotatePoint = rotatePoints(
      [point],
      bound.center,
      element.rotate ?? 0
    )[0];
    const points = rotatePoints(
      bound.points,
      bound.center,
      element.rotate ?? 0
    );
    const tangent = polygonGetPointTangent(points, rotatePoint);
    return new PointLocation(rotatePoint, tangent);
  },
};
