import type { TextElementModel } from '../../../element-model/text.js';
import type { Renderer } from '../../renderer.js';
import {
  deltaInsertsToChunks,
  getFontString,
  getLineHeight,
  getTextWidth,
  isRTL,
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
  // const deltas: ITextDelta[] = yText.toDelta() as ITextDelta[];
  const deltas = wrapTextDeltas(model.text, font, w);
  const lines = deltaInsertsToChunks(deltas);

  const lineHeightPx = getLineHeight(fontFamily, fontSize);
  const horizontalOffset =
    textAlign === 'center' ? w / 2 : textAlign === 'right' ? w : 0;

  for (const [lineIndex, line] of lines.entries()) {
    let beforeTextWidth = 0;

    for (const delta of line) {
      ctx.save();

      const str = delta.insert;
      const rtl = isRTL(str);
      const shouldTemporarilyAttach = rtl && !ctx.canvas.isConnected;
      if (shouldTemporarilyAttach) {
        // to correctly render RTL text mixed with LTR, we have to append it
        // to the DOM
        document.body.appendChild(ctx.canvas);
      }
      ctx.canvas.setAttribute('dir', rtl ? 'rtl' : 'ltr');
      ctx.font = font;
      ctx.fillStyle = renderer.getVariableColor(color);
      ctx.textAlign = textAlign;
      ctx.textBaseline = 'ideographic';

      // 0.5 comes from v-line padding
      const offset =
        textAlign === 'center' ? 0 : textAlign === 'right' ? -0.5 : 0.5;

      ctx.fillText(
        str,
        horizontalOffset + beforeTextWidth + offset,
        (lineIndex + 1) * lineHeightPx
      );

      beforeTextWidth += getTextWidth(str, font);

      if (shouldTemporarilyAttach) {
        ctx.canvas.remove();
      }

      ctx.restore();
    }
  }
}
