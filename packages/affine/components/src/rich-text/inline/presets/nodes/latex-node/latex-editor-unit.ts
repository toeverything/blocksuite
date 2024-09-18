import { ShadowlessElement } from '@blocksuite/block-std';
import { type DeltaInsert, ZERO_WIDTH_SPACE } from '@blocksuite/inline';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { AffineTextAttributes } from '../../../../extension/index.js';

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
    if (
      tokens.length === 0 ||
      tokens.reduce((acc, token) => acc + token.content, '') !==
        this.delta.insert
    ) {
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
