import { assertExists } from '@blocksuite/global/utils';

import { type ConnectorElementModel } from '../../../element-model/connector.js';
import type { ConnectorLabelElementModel } from '../../../element-model/connector-label.js';
import type { Renderer } from '../../renderer.js';
import {
  deltaInsertsToChunks,
  getFontString,
  getLineHeight,
  getTextWidth,
  isRTL,
  type TextDelta,
  wrapTextDeltas,
} from '../text/utils.js';

export function connectorLabel(
  model: ConnectorLabelElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) {
  const {
    actived,
    connector,
    color,
    fontSize,
    fontWeight,
    fontStyle,
    fontFamily,
    textAlign,
    // strokeWidth,
    // rotate,
  } = model;

  // @TODO
  const connectorModel = model.surface.getElementById(
    connector
  ) as ConnectorElementModel;
  assertExists(connectorModel);

  const font = getFontString({
    fontStyle,
    fontWeight,
    fontSize,
    fontFamily,
  });
  const [, , w, h] = model.deserializedXYWH;
  const hw = w / 2;
  const hh = h / 2;
  const deltas = wrapTextDeltas(model.text, font, w);
  const lines = deltaInsertsToChunks(deltas);
  const lineHeight = getLineHeight(fontFamily, fontSize);
  const textHeight = (lines.length - 1) * lineHeight * 0.5;

  ctx.setTransform(matrix);

  if (actived) {
    ctx.fillStyle = renderer.getVariableColor(model.fillColor);
    ctx.fillRect(-2, 0, w + 4, h);
  }
  ctx.font = font;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = renderer.getVariableColor(color);

  const maxTextWidth = getMaxTextWidth(lines, font);

  for (const [index, line] of lines.entries()) {
    for (const delta of line) {
      const str = delta.insert;
      const rtl = isRTL(str);
      const shouldTemporarilyAttach = rtl && !ctx.canvas.isConnected;
      if (shouldTemporarilyAttach) {
        // to correctly render RTL text mixed with LTR, we have to append it
        // to the DOM
        document.body.append(ctx.canvas);
      }

      ctx.canvas.setAttribute('dir', rtl ? 'rtl' : 'ltr');

      const x =
        textAlign === 'center'
          ? 0
          : textAlign === 'right'
            ? maxTextWidth * (rtl ? -0.5 : 0.5)
            : maxTextWidth * (rtl ? 0.5 : -0.5);
      ctx.fillText(str, x + hw, index * lineHeight - textHeight + hh);

      if (shouldTemporarilyAttach) {
        ctx.canvas.remove();
      }
    }
  }
}

function getMaxTextWidth(lines: TextDelta[][], font: string) {
  return lines.reduce(
    (width, line) =>
      line.reduce(
        (width, delta) => Math.max(width, getTextWidth(delta.insert, font)),
        width
      ),
    0
  );
}
