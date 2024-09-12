import type { DividerBlockModel } from '@blocksuite/affine-model';

import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import { html } from 'lit';

import { BLOCK_CHILDREN_CONTAINER_PADDING_LEFT } from '../_common/consts.js';
import { dividerBlockStyles } from './styles.js';

export class DividerBlockComponent extends CaptionedBlockComponent<DividerBlockModel> {
  static override styles = dividerBlockStyles;

  override connectedCallback() {
    super.connectedCallback();

    this.contentEditable = 'false';

    this.handleEvent('click', () => {
      this.host.selection.setGroup('note', [
        this.host.selection.create('block', {
          blockId: this.blockId,
        }),
      ]);
    });
  }

  override renderBlock() {
    const children = html`<div
      class="affine-block-children-container"
      style="padding-left: ${BLOCK_CHILDREN_CONTAINER_PADDING_LEFT}px"
    >
      ${this.renderChildren(this.model)}
    </div>`;

    return html`
      <div class="affine-divider-block-container">
        <hr />

        ${children}
      </div>
    `;
  }

  override accessor useZeroWidth = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-divider': DividerBlockComponent;
  }
}
