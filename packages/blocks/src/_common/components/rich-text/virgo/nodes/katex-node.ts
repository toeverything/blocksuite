import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement } from '@blocksuite/lit';
import {
  type DeltaInsert,
  ZERO_WIDTH_NON_JOINER,
  ZERO_WIDTH_SPACE,
} from '@blocksuite/virgo';
import katex from 'katex';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { AffineTextAttributes } from '../types.js';

@customElement('affine-katex')
export class AffineKatex extends ShadowlessElement {
  static override styles = css`
    .affine-katex {
      white-space: nowrap;
      word-break: break-word;
      color: var(--affine-text-primary-color);
      fill: var(--affine-icon-color);
      border-radius: 4px;
      text-decoration: none;
      cursor: pointer;
      user-select: none;
      padding: 1px 2px 1px 0;
      display: inline-block;
    }
    .affine-katex:hover {
      background: var(--affine-hover-color);
    }

    .affine-katex[data-selected='true'] {
      background: var(--affine-hover-color);
    }
  `;

  @property({ type: Object })
  delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
  };

  @property({ type: Boolean })
  selected = false;

  override updated() {
    const katexContainer = this.querySelector<HTMLElement>('.katex-container');
    assertExists(katexContainer);
    katexContainer.replaceChildren();
    katex.render(this.delta.attributes?.katex ?? '', katexContainer, {
      throwOnError: false,
      displayMode: false,
      output: 'mathml',
      strict: 'true',
    });
  }

  override render() {
    return html`<span class="affine-katex" data-selected=${this.selected}
      ><span class="katex-container"></span
      ><v-text .str=${ZERO_WIDTH_NON_JOINER}></v-text
    ></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-katex': AffineKatex;
  }
}
