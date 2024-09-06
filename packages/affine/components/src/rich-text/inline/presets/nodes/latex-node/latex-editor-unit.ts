import type { AffineTextAttributes } from '@blocksuite/affine-components/rich-text';

import { ShadowlessElement } from '@blocksuite/block-std';
import { type DeltaInsert, ZERO_WIDTH_SPACE } from '@blocksuite/inline';
import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

@customElement('latex-editor-unit')
export class LatexEditorUnit extends ShadowlessElement {
  get latexMenu() {
    return this.closest('latex-editor-menu');
  }

  get vElement() {
    return this.closest('v-element');
  }

  override render() {
    const plainContent = html`<span
      ><v-text .str=${this.delta.insert}></v-text
    ></span>`;

    const latexMenu = this.latexMenu;
    const vElement = this.vElement;
    if (!latexMenu || !vElement) {
      return plainContent;
    }

    const lineIndex = this.vElement.lineIndex;
    const tokens = latexMenu.highlightTokens$.value[lineIndex] ?? [];
    if (tokens.length === 0) {
      return plainContent;
    }

    return html`<span
      >${tokens.map(token => {
        return html`<v-text
          .str=${token.content}
          style=${styleMap({
            color: token.color,
          })}
        ></v-text>`;
      })}</span
    >`;
  }

  @property({ attribute: false })
  accessor delta: DeltaInsert<AffineTextAttributes> = {
    insert: ZERO_WIDTH_SPACE,
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'latex-editor-unit': LatexEditorUnit;
  }
}
