import { html, type TemplateResult } from 'lit';

import type { DeltaInsert } from '../types.js';
import type { BaseTextAttributes } from './base-attributes.js';

export function renderElement<TextAttributes extends BaseTextAttributes>(
  delta: DeltaInsert<TextAttributes>,
  parseAttributes: (
    textAttributes?: TextAttributes
  ) => TextAttributes | undefined
): TemplateResult<1> {
  return html`<v-element
    .delta=${{
      insert: delta.insert,
      attributes: parseAttributes(delta.attributes),
    }}
  ></v-element>`;
}
