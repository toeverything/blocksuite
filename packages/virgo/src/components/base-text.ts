import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { z } from 'zod';

import { ZERO_WIDTH_SPACE } from '../constant.js';
import type { DeltaInsert } from '../types.js';
import { VirgoUnitText } from './virgo-unit-text.js';

export const baseTextAttributes = z.object({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strike: z.boolean().optional(),
  code: z.boolean().optional(),
});

export type BaseTextAttributes = z.infer<typeof baseTextAttributes>;

function virgoTextStyles(
  props: BaseTextAttributes
): ReturnType<typeof styleMap> {
  let textDecorations = '';
  if (props.underline) {
    textDecorations += 'underline';
  }
  if (props.strike) {
    textDecorations += ' line-through';
  }

  let inlineCodeStyle = {};
  if (props.code) {
    inlineCodeStyle = {
      'font-family':
        '"SFMono-Regular", Menlo, Consolas, "PT Mono", "Liberation Mono", Courier, monospace',
      'line-height': 'normal',
      background: 'rgba(135,131,120,0.15)',
      color: '#EB5757',
      'border-radius': '3px',
      'font-size': '85%',
      padding: '0.2em 0.4em',
    };
  }

  return styleMap({
    'white-space': 'break-spaces',
    'font-weight': props.bold ? 'bold' : 'normal',
    'font-style': props.italic ? 'italic' : 'normal',
    'text-decoration': textDecorations.length > 0 ? textDecorations : 'none',
    ...inlineCodeStyle,
  });
}

@customElement('v-text')
export class BaseText extends LitElement {
  @property({ type: Object })
  delta: DeltaInsert<BaseTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
  };

  render() {
    const unitText = new VirgoUnitText();
    unitText.str = this.delta.insert;
    const style = this.delta.attributes
      ? virgoTextStyles(this.delta.attributes)
      : styleMap({});

    // we need to avoid \n appearing before and after the span element, which will
    // cause the unexpected space
    return html`<span data-virgo-element="true" style=${style}
      >${unitText}</span
    >`;
  }

  createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'v-text': BaseText;
  }
}
