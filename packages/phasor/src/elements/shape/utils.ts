import type { Bound } from '../../utils/bound.js';
import type { ITextDelta } from '../text/types.js';
import {
  deltaInsertsToChunks,
  getFontString,
  getLineHeight,
  getTextWidth,
  wrapText,
} from '../text/utils.js';
import { SHAPE_TEXT_PADDING } from './constants.js';
import type { ShapeElement } from './shape-element.js';

export function normalizeShapeBound(shape: ShapeElement, bound: Bound): Bound {
  if (!shape.text) return bound;

  const yText = shape.text;
  const { fontFamily, fontSize } = shape;
  const lineHeight = getLineHeight(fontFamily, fontSize);
  const font = getFontString({
    fontSize: fontSize,
    lineHeight: `${lineHeight}px`,
    fontFamily: fontFamily,
  });
  const widestCharWidth =
    [...yText.toString()]
      .map(char => getTextWidth(char, font))
      .sort((a, b) => a - b)
      .pop() ?? getTextWidth('W', font);

  if (bound.w < widestCharWidth + SHAPE_TEXT_PADDING * 2) {
    bound.w = widestCharWidth + SHAPE_TEXT_PADDING * 2;
  }
  const deltas: ITextDelta[] = (yText.toDelta() as ITextDelta[]).flatMap(
    delta => ({
      insert: wrapText(delta.insert, font, bound.w - SHAPE_TEXT_PADDING * 2),
      attributes: delta.attributes,
    })
  ) as ITextDelta[];
  const lines = deltaInsertsToChunks(deltas);

  if (bound.h < lineHeight * lines.length + SHAPE_TEXT_PADDING * 2) {
    bound.h = lineHeight * lines.length + SHAPE_TEXT_PADDING * 2;
  }

  return bound;
}
