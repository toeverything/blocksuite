import type { AffineTextAttributes } from '@blocksuite/blocks';

import { ShadowlessElement } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import {
  type DeltaInsert,
  ZERO_WIDTH_NON_JOINER,
  ZERO_WIDTH_SPACE,
} from '@blocksuite/inline';
import katex from 'katex';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type TextAttributesWithLatex = {
  latex?: string | null;
} & AffineTextAttributes;

@customElement('latex-node')
export class latexNode extends ShadowlessElement {
  static override styles = css`
    .affine-latex {
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
    .affine-latex:hover {
      background: var(--affine-hover-color);
    }
    .affine-latex[data-selected='true'] {
      background: var(--affine-hover-color);
    }
  `;

  override render() {
    return html`<span class="affine-latex" data-selected=${this.selected}
      ><span class="latex-container"></span
      ><v-text .str=${ZERO_WIDTH_NON_JOINER}></v-text
    ></span>`;
  }

  override updated() {
    const latexContainer = this.querySelector<HTMLElement>('.latex-container');
    assertExists(latexContainer);
    latexContainer.replaceChildren();
    katex.render(this.delta.attributes?.latex ?? '', latexContainer, {
      throwOnError: false,
      displayMode: false,
      output: 'mathml',
    });
  }

  @property({ type: Object })
  accessor delta: DeltaInsert<TextAttributesWithLatex> = {
    insert: ZERO_WIDTH_SPACE,
  };

  @property({ type: Boolean })
  accessor selected = false;
}

declare global {
  interface HTMLElementTagNameMap {
    'latex-node': latexNode;
  }
}
