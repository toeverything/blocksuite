import type { ShapeElementModel } from '../../../element-model/shape.js';
import type { Renderer } from '../../renderer.js';
import { drawGeneralShape } from './utils.js';

export function triangle(
  model: ShapeElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) {
  const {
    seed,
    strokeWidth,
    filled,
    strokeStyle,
    roughness,
    rotate,
    shapeStyle,
  } = model;
  const [, , w, h] = model.deserializedXYWH;
  const renderOffset = Math.max(strokeWidth, 0) / 2;
  const renderWidth = w - renderOffset * 2;
  const renderHeight = h - renderOffset * 2;
  const cx = renderWidth / 2;
  const cy = renderHeight / 2;
  const rc = renderer.rc;
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
    return drawGeneralShape(ctx, model, renderer);
  }

  rc.polygon(
    [
      [renderWidth / 2, 0],
      [renderWidth, renderHeight],
      [0, renderHeight],
    ],
    {
      seed,
      roughness,
      strokeLineDash: strokeStyle === 'dash' ? [12, 12] : undefined,
      stroke: strokeStyle === 'none' ? 'none' : realStrokeColor,
      strokeWidth,
      fill: filled ? realFillColor : undefined,
    }
  );
}
