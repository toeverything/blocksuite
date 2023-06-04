import { StrokeStyle } from '../../../consts.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import { Bound } from '../../../utils/bound.js';
import {
  lineEllipseIntersects,
  pointInEllipse,
  pointOnEllipse,
} from '../../../utils/math-utils.js';
import { type IVec } from '../../../utils/vec.js';
import type { HitTestOptions } from '../../surface-element.js';
import type { ShapeElement } from '../shape-element.js';
import type { ShapeMethods } from '../types.js';

export const EllipseMethods: ShapeMethods = {
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
    const renderWidth = Math.max(1, w - renderOffset * 2);
    const renderHeight = Math.max(1, h - renderOffset * 2);
    const cx = w / 2;
    const cy = h / 2;

    ctx.setTransform(
      matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
    );

    rc.ellipse(renderWidth / 2, renderHeight / 2, renderWidth, renderHeight, {
      seed,
      roughness,
      strokeLineDash: strokeStyle === StrokeStyle.Dashed ? [12, 12] : undefined,
      stroke: realStrokeColor,
      strokeWidth,
      fill: filled ? realFillColor : undefined,
      curveFitting: 1,
    });
  },

  hitTest(
    x: number,
    y: number,
    element: ShapeElement,
    options?: HitTestOptions
  ) {
    const renderOffset = Math.max(element.strokeWidth, 0) / 2;

    return element.filled
      ? pointInEllipse(
          [x, y],
          [element.x + element.w / 2, element.y + element.h / 2],
          element.w / 2,
          element.h / 2
        )
      : pointOnEllipse(
          [
            x - (element.x + (element.w - renderOffset) / 2),
            y - (element.y + (element.h - renderOffset) / 2),
          ],
          (element.w - renderOffset * 2) / 2,
          (element.h - renderOffset * 2) / 2,
          options?.expand ?? 1
        );
  },

  intersectWithLine(start: IVec, end: IVec, element: ShapeElement): boolean {
    const bound = Bound.deserialize(element.xywh);
    return !!lineEllipseIntersects(
      start,
      end,
      bound.center,
      bound.w / 2,
      bound.h / 2
    );
  },
};
