import type { BrushElementModel } from '../../../element-model/brush.js';
import type { Renderer } from '../../renderer.js';

export function brush(
  model: BrushElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) {
  const { color, rotate } = model;
  const [, , w, h] = model.deserializedXYWH;
  const cx = w / 2;
  const cy = h / 2;

  ctx.setTransform(
    matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
  );

  const cacheContent = renderer.requestCacheContent(model, [
    model.commands,
    color,
  ]);

  if (cacheContent.dirty) {
    renderAtCache(cacheContent.ctx, renderer, model, renderer.zoom);
  }

  ctx.drawImage(cacheContent.canvas, 0, 0, w, h);
}

export function renderAtCache(
  ctx: CanvasRenderingContext2D,
  renderer: Renderer,
  model: BrushElementModel,
  zoom: number
) {
  const scale = window.devicePixelRatio * zoom;
  ctx.canvas.width = model.w * scale;
  ctx.canvas.height = model.h * scale;
  ctx.scale(scale, scale);

  ctx.fillStyle = renderer.getVariableColor(model.color);
  ctx.fill(new Path2D(model.commands));
}
