import { BlockElement } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { KeymapController } from '../note-block/keymap-controller.js';
import type { EdgelessTextBlockModel } from './edgeless-text-model.js';

@customElement('affine-edgeless-text')
export class EdgelessTextBlockComponent extends BlockElement<EdgelessTextBlockModel> {
  static override styles = css`
    .affine-edgeless-text-block-container {
      display: flow-root;
    }
    .affine-edgeless-text-block-container.selected {
      background-color: var(--affine-hover-color);
    }
  `;

  keymapController = new KeymapController(this);

  override connectedCallback() {
    super.connectedCallback();

    this.keymapController.bind();
  }

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
