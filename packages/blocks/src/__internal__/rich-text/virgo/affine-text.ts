import { VText } from '@blocksuite/virgo';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { NonShadowLitElement } from '../../index.js';
import type { AffineTextAttributes } from './types.js';

function affineTextStyles(
  props: AffineTextAttributes
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

@customElement('affine-text')
export class AffineText extends NonShadowLitElement {
  @property({ type: Object })
  textAttributes: AffineTextAttributes = {};

  @property({ type: Object })
  vText: VText = new VText();

  render() {
    const style = affineTextStyles(this.textAttributes);
    // we need to avoid \n appearing before and after the span element, which will
    // cause the unexpected space
    return html`<span style=${style}>${this.vText}</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-text': AffineText;
  }
}
