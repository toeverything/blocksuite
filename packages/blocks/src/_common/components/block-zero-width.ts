import type { BlockComponent } from '@blocksuite/block-std';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import { ZERO_WIDTH_SPACE } from '@blocksuite/inline/consts';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('affine-block-zero-width')
export class BlockZeroWidth extends LitElement {
  static override styles = css`
    .affine-block-zero-width {
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

  handleClick() {
    if (this.block.doc.readonly) return;
    const nextBlock = this.block.model.doc.getNext(this.block.model);
    if (nextBlock && nextBlock.flavour !== 'affine:paragraph') {
      const [paragraphId] = this.block.doc.addSiblingBlocks(this.block.model, [
        { flavour: 'affine:paragraph' },
      ]);
      focusTextModel(this.block.host.std, paragraphId);
    }
  }

  override render() {
    return html`<div class="affine-block-zero-width" @click=${this.handleClick}>
      <span>${ZERO_WIDTH_SPACE}</span>
    </div>`;
  }

  @property({ attribute: false })
  accessor block!: BlockComponent;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-block-zero-width': BlockZeroWidth;
  }
}
