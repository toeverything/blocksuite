import { FontFamily, FontWeight } from '../../../element-model/common.js';
import type { GroupElementModel } from '../../../element-model/group.js';
import { Bound } from '../../../utils/bound.js';
import type { Renderer } from '../../renderer.js';
import {
  getFontString,
  getLineHeight,
  getLineWidth,
  truncateTextByWidth,
} from '../text/utils.js';

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
  let text = model.title.toJSON();
  const zoom = renderer.zoom;
  const bound = Bound.deserialize(model.xywh);
  const fontSize = 16 / zoom;
  const fontFamily = FontFamily.Inter;
  const offset = Math.max(4 / zoom, 2);
  ctx.translate(0, -offset);

  const lineHeight = getLineHeight(fontFamily, fontSize);
  const font = getFontString({
    fontSize,
    fontFamily,
    fontWeight: FontWeight.Regular,
    fontStyle: 'normal',
  });
  const lineWidth = getLineWidth(text, font);

  const padding = [Math.min(10 / zoom, 10), Math.min(4 / zoom, 4)];
  const radius = Math.min(4, lineHeight / 2);
  let titleWidth = lineWidth + padding[0] * 2;

  if (titleWidth > bound.w) {
    text = truncateTextByWidth(text, font, bound.w - 10);
    text = text.slice(0, text.length - 1) + '..';
    titleWidth = bound.w;
  }

  if (!model.showTitle) return;

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
