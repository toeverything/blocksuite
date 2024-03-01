import type { BrushElementModel } from '../../../element-model/brush.js';
import { getSvgPathFromStroke } from '../../../utils/math-utils.js';
import type { Renderer } from '../../renderer.js';
import { getSolidStrokePoints } from './utils.js';

export function brush(
  model: BrushElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) {
  const { points, pressures, lineWidth, color, rotate } = model;
  const [, , w, h] = model.deserializedXYWH;
  const cx = w / 2;
  const cy = h / 2;

  ctx.setTransform(
    matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
  );

  const stroke = getSolidStrokePoints(points, pressures, lineWidth);
  const commands = getSvgPathFromStroke(stroke);
  const path = new Path2D(commands);

  ctx.fillStyle = renderer.getVariableColor(color);
  ctx.fill(path);
}
