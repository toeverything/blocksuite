import { VirgoText } from '../components/virgo-text.js';
import type { AttributesRenderer, DeltaInsert } from '../types.js';
import type { BaseTextAttributes } from './base-attributes.js';

/**
 * a default render function for text element
 */
export function renderElement<TextAttributes extends BaseTextAttributes>(
  delta: DeltaInsert<TextAttributes>,
  parseAttributes: (
    textAttributes?: TextAttributes
  ) => TextAttributes | undefined,
  attributesRenderer: AttributesRenderer<TextAttributes>
): VirgoText<TextAttributes> {
  const baseText = new VirgoText<TextAttributes>();
  baseText.delta = {
    insert: delta.insert,
    attributes: parseAttributes(delta.attributes),
  };
  baseText.attributesRenderer = attributesRenderer;

  return baseText;
}
