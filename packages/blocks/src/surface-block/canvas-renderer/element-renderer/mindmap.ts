import type { IBound } from '../../consts.js';
import type { MindmapElementModel } from '../../element-model/mindmap.js';
import type { Renderer } from '../renderer.js';
import { connector } from './connector/index.js';

export function mindmap(
  model: MindmapElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer,
  bound: IBound
) {
  const dx = model.x - bound.x;
  const dy = model.y - bound.y;

  matrix = matrix.translate(-dx, -dy);

  model.connectors.forEach(connectorEl => {
    const dx = connectorEl.x - bound.x;
    const dy = connectorEl.y - bound.y;

    connector(connectorEl, ctx, matrix.translate(dx, dy), renderer);
  });
}
