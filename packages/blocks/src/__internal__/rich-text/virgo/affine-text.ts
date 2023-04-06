import { type DeltaInsert, ZERO_WIDTH_SPACE } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { ShadowlessElement } from '../../index.js';
import type { AffineTextAttributes } from './types.js';

export function affineTextStyles(
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
      'font-family': 'var(--affine-font-code-family)',
      background: 'var(--affine-code-background)',
      color: 'var(--affine-code-color)',
      'border-radius': '5px',
      padding: '0 5px',
      'font-size': 'calc(var(--affine-font-base) - 4px)',
      'font-variant-ligatures': 'none',
    };
  }

  return styleMap({
    'font-weight': props.bold ? 'bold' : 'normal',
    'font-style': props.italic ? 'italic' : 'normal',
    'text-decoration': textDecorations.length > 0 ? textDecorations : 'none',
    ...inlineCodeStyle,
  });
}

@customElement('affine-text')
export class AffineText extends ShadowlessElement {
  static styles = css`
    affine-text {
      white-space: pre-wrap;
      word-break: break-word;
    }
  `;

  @property({ type: Object })
  delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
  };

  render() {
    const style = this.delta.attributes
      ? affineTextStyles(this.delta.attributes)
      : styleMap({});
    // we need to avoid \n appearing before and after the span element, which will
    // cause the unexpected space
    return html`<span style=${style}
      ><v-text .str=${this.delta.insert}></v-text
    ></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-text': AffineText;
  }
}
