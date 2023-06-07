import { StrokeStyle } from '../../../consts.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import { Bound } from '../../../utils/bound.js';
import {
  linePolygonIntersects,
  pointInPolygon,
  pointOnPolygonStoke,
} from '../../../utils/math-utils.js';
import { type IVec } from '../../../utils/vec.js';
import type { HitTestOptions } from '../../surface-element.js';
import type { ShapeElement } from '../shape-element.js';
import type { ShapeMethods } from '../types.js';

export const TriangleMethods: ShapeMethods = {
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
      flipX,
      flipY,
      widthAndHeight: [w, h],
    } = element;

    const renderOffset = Math.max(strokeWidth, 0) / 2;
    const renderWidth = w - renderOffset * 2;
    const renderHeight = h - renderOffset * 2;
    const cx = w / 2;
    const cy = h / 2;

    // ctx.setTransform(
    //   matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
    // );
    matrix.translateSelf(cx, cy);

    if (flipX < 0) {
      matrix = matrix.flipX();
    }
    if (flipY < 0) {
      matrix = matrix.flipY();
    }

    ctx.setTransform(matrix.rotateSelf(rotate).translateSelf(-cx, -cy));

    rc.polygon(
      [
        [renderWidth / 2, 0],
        [renderWidth, renderHeight],
        [0, renderHeight],
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
    const points = [
      [element.x + element.w / 2, element.y + 0],
      [element.x + element.w, element.y + element.h],
      [element.x + 0, element.y + element.h],
    ];

    return element.filled
      ? pointInPolygon([x, y], points)
      : pointOnPolygonStoke([x, y], points, options?.expand ?? 1);
  },

  intersectWithLine(start: IVec, end: IVec, element: ShapeElement): boolean {
    const bound = Bound.deserialize(element.xywh);
    const { x, y, w, h } = bound;

    return !!linePolygonIntersects(start, end, [
      [x + w / 2, 0 + y],
      [x + w, h + y],
      [x + 0, h + y],
    ]);
  },
};
