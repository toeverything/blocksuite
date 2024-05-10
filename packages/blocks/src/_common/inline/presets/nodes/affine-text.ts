import { ShadowlessElement } from '@blocksuite/block-std';
import { type DeltaInsert, ZERO_WIDTH_SPACE } from '@blocksuite/inline';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import type { AffineTextAttributes } from '../affine-inline-specs.js';

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
      'border-radius': '2px',
      padding: '3px 6px 4px',
      'font-variant-ligatures': 'none',
      'line-height': 'var(--affine-font-base)',
    };
  }

  return styleMap({
    'font-weight': props.bold ? 'bolder' : 'inherit',
    'font-style': props.italic ? 'italic' : 'normal',
    'background-color': props.background ? props.background : undefined,
    color: props.color ? props.color : undefined,
    'text-decoration': textDecorations.length > 0 ? textDecorations : 'none',
    ...inlineCodeStyle,
    ...override,
  });
}

@customElement('affine-text')
export class AffineText extends ShadowlessElement {
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
    if (this.delta.attributes?.code) {
      return html`<code style=${style}
        ><v-text .str=${this.delta.insert}></v-text
      ></code>`;
    }

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
