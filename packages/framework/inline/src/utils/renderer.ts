import { html, type TemplateResult } from 'lit';

import type { DeltaInsert } from '../types.js';
import type { BaseTextAttributes } from './base-attributes.js';

export function renderElement<TextAttributes extends BaseTextAttributes>(
  delta: DeltaInsert<TextAttributes>,
  parseAttributes: (
    textAttributes?: TextAttributes
  ) => TextAttributes | undefined,
  selected: boolean
): TemplateResult<1> {
  return html`<v-element
    .selected=${selected}
    .delta=${{
      insert: delta.insert,
      attributes: parseAttributes(delta.attributes),
    }}
  ></v-element>`;
}
