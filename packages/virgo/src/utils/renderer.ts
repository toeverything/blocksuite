import { VirgoElement } from '../components/virgo-element.js';
import type { AttributesRenderer, DeltaInsert } from '../types.js';
import type { BaseTextAttributes } from './base-attributes.js';

export function renderElement<TextAttributes extends BaseTextAttributes>(
  delta: DeltaInsert<TextAttributes>,
  parseAttributes: (
    textAttributes?: TextAttributes
  ) => TextAttributes | undefined,
  attributesRenderer: AttributesRenderer<TextAttributes>
): VirgoElement<TextAttributes> {
  const vElement = new VirgoElement<TextAttributes>();
  vElement.delta = {
    insert: delta.insert,
    attributes: parseAttributes(delta.attributes),
  };
  vElement.attributesRenderer = attributesRenderer;

  return vElement;
}
