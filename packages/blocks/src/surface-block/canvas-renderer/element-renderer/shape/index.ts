import type { IBound } from '../../../consts.js';
import type {
  ShapeElementModel,
  ShapeType,
} from '../../../element-model/shape.js';
import { Bound } from '../../../utils/bound.js';
import type { Renderer } from '../../renderer.js';
import {
  deltaInsertsToChunks,
  getFontString,
  getLineHeight,
  getLineWidth,
  isRTL,
  wrapTextDeltas,
} from '../text/utils.js';
import { diamond } from './diamond.js';
import { ellipse } from './ellipse.js';
import { rect } from './rect.js';
import { triangle } from './triangle.js';
import {
  horizontalOffset,
  SHAPE_TEXT_PADDING,
  verticalOffset,
} from './utils.js';

const shapeRenderers: {
  [key in ShapeType]: (
    model: ShapeElementModel,
    ctx: CanvasRenderingContext2D,
    matrix: DOMMatrix,
    renderer: Renderer
  ) => void;
} = {
  diamond,
  rect,
  triangle,
  ellipse,
};

export function shape(
  model: ShapeElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) {
  shapeRenderers[model.shapeType](model, ctx, matrix, renderer);

  if (model.textDisplay) {
    renderText(model, ctx, renderer);
  }
}

function renderText(
  model: ShapeElementModel,
  ctx: CanvasRenderingContext2D,
  renderer: Renderer
) {
  const {
    x,
    y,
    text,
    color,
    fontSize,
    fontFamily,
    textAlign,
    w,
    h,
    textVerticalAlign,
  } = model;
  if (!text) return;

  const lineHeight = getLineHeight(fontFamily, fontSize);
  const font = getFontString({
    fontSize,
    fontFamily,
    fontWeight: model.fontWeight,
    fontStyle: model.fontStyle,
  });
  const lines = deltaInsertsToChunks(
    wrapTextDeltas(text, font, w - SHAPE_TEXT_PADDING * 2)
  );
  const horiOffset = horizontalOffset(model.w, model.textAlign);
  const vertOffset = verticalOffset(lines, lineHeight, h, textVerticalAlign);
  let maxLineWidth = 0;

  for (const [lineIndex, line] of lines.entries()) {
    for (const delta of line) {
      ctx.save();

      const str = delta.insert;
      const rtl = isRTL(str);
      const shouldTemporarilyAttach = rtl && !ctx.canvas.isConnected;
      if (shouldTemporarilyAttach) {
        // to correctly render RTL text mixed with LTR, we have to append it
        // to the DOM
        document.body.append(ctx.canvas);
      }
      ctx.canvas.setAttribute('dir', rtl ? 'rtl' : 'ltr');
      ctx.font = font;
      ctx.fillStyle = renderer.getVariableColor(color);
      ctx.textAlign = textAlign;

      ctx.textBaseline = 'ideographic';

      ctx.fillText(
        str,
        // 1.5 is the magic number to make the text align with the DOM text
        horiOffset - 1.5,
        (lineIndex + 1) * lineHeight + vertOffset - 1.5
      );

      maxLineWidth = Math.max(maxLineWidth, getLineWidth(str, font));

      if (shouldTemporarilyAttach) {
        ctx.canvas.remove();
      }

      ctx.restore();
    }
  }

  const bound = new Bound(
    x + (w - maxLineWidth) / 2,
    y + vertOffset - 2,
    maxLineWidth,
    lineHeight * lines.length
  ) as IBound;

  bound.rotate = model.rotate ?? 0;
  model.textBound = bound;
}
