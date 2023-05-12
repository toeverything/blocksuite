import { ShadowlessElement } from '@blocksuite/lit';
import { type DeltaInsert, ZERO_WIDTH_SPACE } from '@blocksuite/virgo';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import type { AffineTextAttributes } from './types.js';

export function affineTextStyles(
  props: AffineTextAttributes,
  override?: Readonly<StyleInfo>
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
      background: 'var(--affine-background-code-block)',
      color: 'var(--affine-text-primary-color)',
      'border-radius': '4px',
      padding: '3px 6px',
      'font-size': 'calc(var(--affine-font-base) - 4px)',
      'font-variant-ligatures': 'none',
      'line-height': 'var(--affine-font-base)',
      border: '1px solid var(--affine-border-color)',
    };
  }

  return styleMap({
    'font-weight': props.bold ? 'bold' : 'normal',
    'font-style': props.italic ? 'italic' : 'normal',
    'text-decoration': textDecorations.length > 0 ? textDecorations : 'none',
    ...inlineCodeStyle,
    ...override,
  });
}

@customElement('affine-text')
export class AffineText extends ShadowlessElement {
  static override styles = css`
    affine-text {
      white-space: break-spaces;
      word-break: break-word;
    }
  `;

  @property({ type: Object })
  delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
  };

  override render() {
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
