import { Bound } from '@blocksuite/global/utils';

import type { GroupElementModel } from '../../../element-model/group.js';
import type { Renderer } from '../../renderer.js';

import { titleRenderParams } from './utils.js';

export function group(
  model: GroupElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) {
  const { xywh } = model;
  const elements = renderer.provider.selectedElements?.() || [];

  ctx.setTransform(matrix);

  if (elements.includes(model.id)) {
    renderTitle(model, ctx, renderer);
  } else if (model.childElements.some(child => elements.includes(child.id))) {
    const bound = Bound.deserialize(xywh);
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = renderer.getVariableColor('--affine-blue');
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, bound.w, bound.h);

    renderTitle(model, ctx, renderer);
  }
}

function renderTitle(
  model: GroupElementModel,
  ctx: CanvasRenderingContext2D,
  renderer: Renderer
) {
  const zoom = renderer.viewport.zoom;
  const {
    titleWidth,
    text,
    lineHeight,
    font,
    padding,
    offset,
    radius,
    titleBound,
  } = titleRenderParams(model, zoom);

  if (!model.showTitle) return;

  model.externalXYWH = titleBound.serialize();

  ctx.translate(0, -offset);

  ctx.beginPath();
  ctx.roundRect(
    0,
    -lineHeight - padding[1] * 2,
    titleWidth,
    lineHeight + padding[1] * 2,
    radius
  );
  ctx.fillStyle = '#E3E2E4';
  ctx.fill();

  ctx.font = font;
  ctx.fillStyle = '#424149';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, padding[0], -lineHeight / 2 - padding[1]);
}
