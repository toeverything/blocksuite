import type { IBound } from '@blocksuite/global/utils';

import { Bound } from '@blocksuite/global/utils';

import type {
  ShapeElementModel,
  ShapeType,
} from '../../../element-model/shape.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import type { Renderer } from '../../renderer.js';

import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
  DEFAULT_SHAPE_TEXT_COLOR,
} from '../../../elements/shape/consts.js';
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
import { type CustomStyle, horizontalOffset, verticalOffset } from './utils.js';

const shapeRenderers: {
  [key in ShapeType]: (
    model: ShapeElementModel,
    ctx: CanvasRenderingContext2D,
    matrix: DOMMatrix,
    renderer: Renderer,
    rc: RoughCanvas,
    custom: CustomStyle
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
  const color = renderer.getColorValue(
    model.color,
    DEFAULT_SHAPE_TEXT_COLOR,
    true
  );
  const fillColor = renderer.getColorValue(
    model.fillColor,
    DEFAULT_SHAPE_STROKE_COLOR,
    true
  );
  const strokeColor = renderer.getColorValue(
    model.strokeColor,
    DEFAULT_SHAPE_FILL_COLOR,
    true
  );
  const customStyle = { color, fillColor, strokeColor };

  shapeRenderers[model.shapeType](
    model,
    ctx,
    matrix,
    renderer,
    rc,
    customStyle
  );

  if (model.textDisplay) {
    renderText(model, ctx, customStyle);
  }
}

function renderText(
  model: ShapeElementModel,
  ctx: CanvasRenderingContext2D,
  { color }: CustomStyle
) {
  const {
    x,
    y,
    text,
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
  ctx.fillStyle = color;
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
