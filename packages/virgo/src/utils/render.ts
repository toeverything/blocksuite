import { BaseText, baseTextAttributes } from '../components/base-text.js';
import type { DeltaInsert, TextElement } from '../types.js';

/**
 * a default render function for text element
 */
export function baseRenderElement(delta: DeltaInsert): TextElement {
  const parseResult = baseTextAttributes.optional().parse(delta.attributes);

  const baseText = new BaseText();
  baseText.delta = {
    insert: delta.insert,
    attributes: parseResult,
  };

  return baseText;
}
