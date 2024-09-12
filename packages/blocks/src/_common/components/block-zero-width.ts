import type { BlockComponent } from '@blocksuite/block-std';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import { stopPropagation } from '@blocksuite/affine-shared/utils';
import { ZERO_WIDTH_SPACE } from '@blocksuite/inline/consts';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

export class BlockZeroWidth extends LitElement {
  static override styles = css`
    .block-zero-width {
      position: absolute;
      bottom: -10px;
      width: 100%;
      cursor: text;
      z-index: 1;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
  }

  handleClick(e: MouseEvent) {
    stopPropagation(e);
    if (this.block.doc.readonly) return;
    const nextBlock = this.block.model.doc.getNext(this.block.model);
    if (nextBlock?.flavour !== 'affine:paragraph') {
      const [paragraphId] = this.block.doc.addSiblingBlocks(this.block.model, [
        { flavour: 'affine:paragraph' },
      ]);
      focusTextModel(this.block.host.std, paragraphId);
    }
  }

  override render() {
    return html`<div class="block-zero-width" @click=${this.handleClick}>
      <span>${ZERO_WIDTH_SPACE}</span>
    </div>`;
  }

  @property({ attribute: false })
  accessor block!: BlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    'block-zero-width': BlockZeroWidth;
  }
}
