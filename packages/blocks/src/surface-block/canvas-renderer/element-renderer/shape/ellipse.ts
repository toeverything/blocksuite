import type { ShapeElementModel } from '../../../element-model/shape.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import type { Renderer } from '../../renderer.js';

import { type Colors, drawGeneralShape } from './utils.js';

export function ellipse(
  model: ShapeElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer,
  rc: RoughCanvas,
  colors: Colors
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
  const renderWidth = Math.max(1, w - renderOffset * 2);
  const renderHeight = Math.max(1, h - renderOffset * 2);
  const cx = renderWidth / 2;
  const cy = renderHeight / 2;

  const { fillColor, strokeColor } = colors;

  ctx.setTransform(
    matrix
      .translateSelf(renderOffset, renderOffset)
      .translateSelf(cx, cy)
      .rotateSelf(rotate)
      .translateSelf(-cx, -cy)
  );

  if (shapeStyle === 'General') {
    drawGeneralShape(ctx, model, renderer, fillColor, strokeColor);
  } else {
    rc.ellipse(cx, cy, renderWidth, renderHeight, {
      seed,
      roughness: shapeStyle === 'Scribbled' ? roughness : 0,
      strokeLineDash: strokeStyle === 'dash' ? [12, 12] : undefined,
      stroke: strokeStyle === 'none' ? 'none' : strokeColor,
      strokeWidth,
      fill: filled ? fillColor : undefined,
      curveFitting: 1,
    });
  }
}
