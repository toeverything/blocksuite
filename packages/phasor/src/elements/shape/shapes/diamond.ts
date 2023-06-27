import { StrokeStyle } from '../../../consts.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import { Bound } from '../../../utils/bound.js';
import {
  getPointsFromBoundsWithRotation,
  linePolygonIntersects,
  pointInPolygon,
  pointOnPolygonStoke,
} from '../../../utils/math-utils.js';
import { type IVec } from '../../../utils/vec.js';
import type { HitTestOptions } from '../../surface-element.js';
import type { ShapeElement } from '../shape-element.js';
import type { ShapeMethods } from '../types.js';

export const DiamondMethods: ShapeMethods = {
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
      strokeStyle,
      roughness,
      rotate,
      widthAndHeight: [w, h],
    } = element;

    const renderOffset = Math.max(strokeWidth, 0) / 2;
    const renderWidth = w - renderOffset * 2;
    const renderHeight = h - renderOffset * 2;
    const cx = renderWidth / 2;
    const cy = renderHeight / 2;

    ctx.setTransform(
      matrix
        .translate(renderOffset, renderOffset)
        .translateSelf(cx, cy)
        .rotateSelf(rotate)
        .translateSelf(-cx, -cy)
    );

    rc.polygon(
      [
        [renderWidth / 2, 0],
        [renderWidth, renderHeight / 2],
        [renderWidth / 2, renderHeight],
        [0, renderHeight / 2],
      ],
      {
        seed,
        roughness,
        strokeLineDash:
          strokeStyle === StrokeStyle.Dashed ? [12, 12] : undefined,
        stroke: realStrokeColor,
        strokeWidth,
        fill: filled ? realFillColor : undefined,
      }
    );
  },

  hitTest(
    x: number,
    y: number,
    element: ShapeElement,
    options?: HitTestOptions
  ) {
    const points = getPointsFromBoundsWithRotation(
      element,
      ({ x, y, w, h }) => [
        new DOMPoint(x, y + h / 2),
        new DOMPoint(x + w / 2, y),
        new DOMPoint(x + w, y + h / 2),
        new DOMPoint(x + w / 2, y + h),
      ]
    );

    let hited = pointOnPolygonStoke([x, y], points, options?.expand ?? 1);

    if (element.filled && !hited) {
      hited = pointInPolygon([x, y], points);
    }

    return hited;
  },

  intersectWithLine(start: IVec, end: IVec, element: ShapeElement): boolean {
    const bound = Bound.deserialize(element.xywh);
    const { x, y, w, h } = bound;

    return !!linePolygonIntersects(start, end, [
      [x + w / 2, y],
      [x + w, h / 2 + y],
      [x + w / 2, h + y],
      [x, h / 2 + y],
    ]);
  },
};
