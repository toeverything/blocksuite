import type { IBound } from '../../../consts.js';
import type {
  ShapeElementModel,
  ShapeType,
} from '../../../element-model/shape.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import { Bound } from '../../../utils/bound.js';
import type { Renderer } from '../../renderer.js';
import {
  deltaInsertsToChunks,
  getFontMetrics,
  getFontString,
  getLineWidth,
  isRTL,
  measureTextInDOM,
  wrapTextDeltas,
} from '../text/utils.js';
import { diamond } from './diamond.js';
import { ellipse } from './ellipse.js';
import { rect } from './rect.js';
import { triangle } from './triangle.js';
import { horizontalOffset, verticalOffset } from './utils.js';

const shapeRenderers: {
  [key in ShapeType]: (
    model: ShapeElementModel,
    ctx: CanvasRenderingContext2D,
    matrix: DOMMatrix,
    renderer: Renderer,
    rc: RoughCanvas
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
  renderer: Renderer,
  rc: RoughCanvas
) {
  shapeRenderers[model.shapeType](model, ctx, matrix, renderer, rc);

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
    fontWeight,
    textAlign,
    w,
    h,
    textVerticalAlign,
    padding,
  } = model;
  if (!text) return;

  const [verticalPadding, horPadding] = padding;
  const font = getFontString(model);
  const { lineGap, lineHeight } = measureTextInDOM(
    fontFamily,
    fontSize,
    fontWeight
  );
  const metrics = getFontMetrics(fontFamily, fontSize, fontWeight);
  const lines = deltaInsertsToChunks(
    wrapTextDeltas(text, font, w - horPadding * 2)
  );
  const horOffset = horizontalOffset(model.w, model.textAlign, horPadding);
  const vertOffset =
    verticalOffset(
      lines,
      lineHeight + lineGap,
      h,
      textVerticalAlign,
      verticalPadding
    ) +
    metrics.fontBoundingBoxAscent +
    lineGap / 2;
  let maxLineWidth = 0;

  ctx.font = font;
  ctx.fillStyle = renderer.getVariableColor(color);
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'alphabetic';

  for (const [lineIndex, line] of lines.entries()) {
    for (const delta of line) {
      const str = delta.insert;
      const rtl = isRTL(str);
      const shouldTemporarilyAttach = rtl && !ctx.canvas.isConnected;
      if (shouldTemporarilyAttach) {
        // to correctly render RTL text mixed with LTR, we have to append it
        // to the DOM
        document.body.append(ctx.canvas);
      }

      if (ctx.canvas.dir !== (rtl ? 'rtl' : 'ltr')) {
        ctx.canvas.setAttribute('dir', rtl ? 'rtl' : 'ltr');
      }

      ctx.fillText(
        str,
        // 0.5 is the dom editor padding to make the text align with the DOM text
        horOffset + 0.5,
        lineIndex * lineHeight + vertOffset
      );

      maxLineWidth = Math.max(maxLineWidth, getLineWidth(str, font));

      if (shouldTemporarilyAttach) {
        ctx.canvas.remove();
      }
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
