import { BlockElement } from '@blocksuite/block-std';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { EdgelessTextBlockModel } from './edgeless-text-model.js';

export const EDGELESS_TEXT_BLOCK_MIN_WIDTH = 50;
export const EDGELESS_TEXT_BLOCK_MIN_HEIGHT = 50;

@customElement('affine-edgeless-text')
export class EdgelessTextBlockComponent extends BlockElement<EdgelessTextBlockModel> {
  override renderBlock() {
    return html`
      <div class="affine-edgeless-text-block-container">
        <div class="affine-block-children-container">
          ${this.renderChildren(this.model)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-edgeless-text': EdgelessTextBlockComponent;
  }
}
