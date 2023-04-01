import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import type { AttributesRenderer } from '../types.js';
import type { BaseTextAttributes } from './base-attributes.js';

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
    'white-space': 'pre-wrap',
    'font-weight': props.bold ? 'bold' : 'normal',
    'font-style': props.italic ? 'italic' : 'normal',
    'text-decoration': textDecorations.length > 0 ? textDecorations : 'none',
    ...inlineCodeStyle,
  });
}

export const getDefaultAttributeRenderer =
  <T extends BaseTextAttributes>(): AttributesRenderer<T> =>
  delta => {
    const style = delta.attributes
      ? virgoTextStyles(delta.attributes)
      : styleMap({});
    return html`<span style=${style}
      ><v-text .str=${delta.insert}></v-text
    ></span>`;
  };
