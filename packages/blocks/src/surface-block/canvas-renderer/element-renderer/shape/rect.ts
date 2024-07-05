import type { ShapeElementModel } from '../../../element-model/shape.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import type { Renderer } from '../../renderer.js';
import { drawGeneralShape } from './utils.js';

/**
 * "magic number" for bezier approximations of arcs (http://itc.ktu.lt/itc354/Riskus354.pdf)
 */
const K_RECT = 1 - 0.5522847498;

export function rect(
  model: ShapeElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer,
  rc: RoughCanvas
) {
  const {
    seed,
    strokeWidth,
    filled,
    radius,
    strokeStyle,
    roughness,
    rotate,
    shapeStyle,
  } = model;
  const [, , w, h] = model.deserializedXYWH;
  const renderOffset = Math.max(strokeWidth, 0) / 2;
  const renderWidth = w - renderOffset * 2;
  const renderHeight = h - renderOffset * 2;
  const r =
    radius < 1 ? Math.min(renderWidth * radius, renderHeight * radius) : radius;
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
    rc.path(
      `
      M ${r} 0
      L ${renderWidth - r} 0
      C ${renderWidth - K_RECT * r} 0 ${renderWidth} ${
        K_RECT * r
      } ${renderWidth} ${r}
      L ${renderWidth} ${renderHeight - r}
      C ${renderWidth} ${renderHeight - K_RECT * r} ${
        renderWidth - K_RECT * r
      } ${renderHeight} ${renderWidth - r} ${renderHeight}
      L ${r} ${renderHeight}
      C ${K_RECT * r} ${renderHeight} 0 ${renderHeight - K_RECT * r} 0 ${
        renderHeight - r
      }
      L 0 ${r}
      C 0 ${K_RECT * r} ${K_RECT * r} 0 ${r} 0
      Z
      `,
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

  ctx.setTransform(
    ctx
      .getTransform()
      .translateSelf(-cx, -cy)
      .rotateSelf(-rotate)
      .translateSelf(cx, cy)
      .translateSelf(-renderOffset, -renderOffset)
      .translateSelf(cx, cy)
      .rotateSelf(rotate)
      .translateSelf(-cx, -cy)
  );
}
