import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { AttributeRenderer } from '../types.js';
import type { BaseTextAttributes } from './base-attributes.js';

function inlineTextStyles(
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
      background: 'rgba(135,131,120,0.15)',
      'border-radius': '3px',
      color: '#EB5757',
      'font-family':
        '"SFMono-Regular", Menlo, Consolas, "PT Mono", "Liberation Mono", Courier, monospace',
      'font-size': '85%',
      'line-height': 'normal',
      padding: '0.2em 0.4em',
    };
  }

  return styleMap({
    'font-style': props.italic ? 'italic' : 'normal',
    'font-weight': props.bold ? 'bold' : 'normal',
    'text-decoration': textDecorations.length > 0 ? textDecorations : 'none',
    ...inlineCodeStyle,
  });
}

export const getDefaultAttributeRenderer =
  <T extends BaseTextAttributes>(): AttributeRenderer<T> =>
  delta => {
    const style = delta.attributes
      ? inlineTextStyles(delta.attributes)
      : styleMap({});
    return html`<span style=${style}
      ><v-text .str=${delta.insert}></v-text
    ></span>`;
  };
