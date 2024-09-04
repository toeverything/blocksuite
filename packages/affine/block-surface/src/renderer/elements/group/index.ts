import type { GroupElementModel } from '@blocksuite/affine-model';

import { Bound } from '@blocksuite/global/utils';

import type { CanvasRenderer } from '../../canvas-renderer.js';

import { titleRenderParams } from './utils.js';

export function group(
  model: GroupElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: CanvasRenderer
) {
  const { xywh } = model;
  const bound = Bound.deserialize(xywh);
  const elements = renderer.provider.selectedElements?.() || [];

  const renderParams = titleRenderParams(model, renderer.viewport.zoom);
  model.externalXYWH = renderParams.titleBound.serialize();

  ctx.setTransform(matrix);

  if (elements.includes(model.id)) {
    if (model.showTitle) {
      renderTitle(model, ctx, renderer, renderParams);
    } else {
      ctx.lineWidth = 2 / renderer.viewport.zoom;
      ctx.strokeStyle = renderer.getPropertyValue('--affine-blue');
      ctx.strokeRect(0, 0, bound.w, bound.h);
    }
  } else if (model.childElements.some(child => elements.includes(child.id))) {
    ctx.lineWidth = 2 / renderer.viewport.zoom;
    ctx.strokeStyle = '#8FD1FF';
    ctx.strokeRect(0, 0, bound.w, bound.h);

    if (model.showTitle) renderTitle(model, ctx, renderer, renderParams);
  }
}

function renderTitle(
  model: GroupElementModel,
  ctx: CanvasRenderingContext2D,
  renderer: CanvasRenderer,
  renderParams: ReturnType<typeof titleRenderParams>
) {
  const { text, lineHeight, font, padding, offset, titleBound } = renderParams;

  model.externalXYWH = titleBound.serialize();

  ctx.translate(0, -offset);

  ctx.beginPath();

  ctx.font = font;
  ctx.fillStyle = renderer.getPropertyValue('--affine-blue');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, padding[0], -lineHeight / 2 - padding[1]);
}
