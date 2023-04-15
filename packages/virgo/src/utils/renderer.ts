import { html, type TemplateResult } from 'lit';

import type { AttributeRenderer, DeltaInsert } from '../types.js';
import type { BaseTextAttributes } from './base-attributes.js';

export function renderElement<TextAttributes extends BaseTextAttributes>(
  delta: DeltaInsert<TextAttributes>,
  parseAttributes: (
    textAttributes?: TextAttributes
  ) => TextAttributes | undefined,
  attributeRenderer: AttributeRenderer<TextAttributes>
): TemplateResult<1> {
  return html`<v-element
    .delta=${{
      insert: delta.insert,
      attributes: parseAttributes(delta.attributes),
    }}
    .attributeRenderer=${attributeRenderer}
  ></v-element>`;
}
