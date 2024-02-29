import type { TextElementModel } from '../../../element-model/text.js';
import type { Renderer } from '../../renderer.js';
import {
  deltaInsertsToChunks,
  getFontString,
  getLineHeight,
  getTextWidth,
  wrapTextDeltas,
} from './utils.js';

export function text(
  model: TextElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) {
  const {
    color,
    fontSize,
    fontWeight,
    fontStyle,
    fontFamily,
    textAlign,
    rotate,
  } = model;
  const [, , w, h] = model.deserializedXYWH;
  const cx = w / 2;
  const cy = h / 2;

  ctx.setTransform(
    matrix.translateSelf(cx, cy).rotateSelf(rotate).translateSelf(-cx, -cy)
  );

  // const deltas: ITextDelta[] = yText.toDelta() as ITextDelta[];
  const font = getFontString({
    fontStyle,
    fontWeight,
    fontSize,
    fontFamily,
  });

  const cacheContent = renderer.requestCacheContent(model, [
    model.text.toString(),
    font,
    color,
    textAlign,
    w,
    h,
    fontFamily,
    fontSize,
  ]);

  if (cacheContent.dirty) {
    renderAtCache(cacheContent.ctx, renderer, model, {
      font,
    });
  }

  ctx.drawImage(cacheContent.canvas, 0, 0, w, h);
}

export function renderAtCache(
  ctx: CanvasRenderingContext2D,
  renderer: Renderer,
  model: TextElementModel,
  params: {
    font: string;
  }
) {
  const { font } = params;
  const { w, h, textAlign, color, fontFamily, fontSize } = model;
  const deltas = wrapTextDeltas(model.text, font, w);
  const lines = deltaInsertsToChunks(deltas);
  const lineHeightPx = getLineHeight(fontFamily, fontSize);
  const horizontalOffset =
    textAlign === 'center' ? w / 2 : textAlign === 'right' ? w : 0;
  const scale = window.devicePixelRatio * renderer.zoom;

  ctx.canvas.width = w * scale;
  ctx.canvas.height = h * scale;

  ctx.scale(scale, scale);

  ctx.save();
  ctx.font = font;
  ctx.fillStyle = renderer.getVariableColor(color);
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'ideographic';

  for (const [lineIndex, line] of lines.entries()) {
    let beforeTextWidth = 0;

    for (const delta of line) {
      const str = delta.insert;
      // 0.5 comes from v-line padding
      const offset =
        textAlign === 'center' ? 0 : textAlign === 'right' ? -0.5 : 0.5;

      ctx.fillText(
        str,
        horizontalOffset + beforeTextWidth + offset,
        (lineIndex + 1) * lineHeightPx
      );

      beforeTextWidth += getTextWidth(str, font);
    }
  }

  ctx.restore();
}
