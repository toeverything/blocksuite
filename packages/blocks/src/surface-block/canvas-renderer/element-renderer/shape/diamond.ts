import type { ShapeElementModel } from '../../../element-model/shape.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import type { Renderer } from '../../renderer.js';

import { drawGeneralShape } from './utils.js';

export function diamond(
  model: ShapeElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer,
  rc: RoughCanvas
) {
  const {
    filled,
    rotate,
    roughness,
    seed,
    shapeStyle,
    strokeStyle,
    strokeWidth,
  } = model;
  const [, , w, h] = model.deserializedXYWH;
  const renderOffset = Math.max(strokeWidth, 0) / 2;
  const renderWidth = w - renderOffset * 2;
  const renderHeight = h - renderOffset * 2;
  const cx = renderWidth / 2;
  const cy = renderHeight / 2;
  const realFillColor = renderer.getVariableColor(model.fillColor);
  const realStrokeColor = renderer.getVariableColor(model.strokeColor);

  ctx.setTransform(
    matrix
      .translateSelf(renderOffset, renderOffset)
      .translateSelf(cx, cy)
      .rotateSelf(rotate)
      .translateSelf(-cx, -cy)
  );

  if (shapeStyle === 'General') {
    drawGeneralShape(ctx, model, renderer);
  } else {
    rc.polygon(
      [
        [renderWidth / 2, 0],
        [renderWidth, renderHeight / 2],
        [renderWidth / 2, renderHeight],
        [0, renderHeight / 2],
      ],
      {
        fill: filled ? realFillColor : undefined,
        roughness: shapeStyle === 'Scribbled' ? roughness : 0,
        seed,
        stroke: strokeStyle === 'none' ? 'none' : realStrokeColor,
        strokeLineDash: strokeStyle === 'dash' ? [12, 12] : undefined,
        strokeWidth,
      }
    );
  }
}
