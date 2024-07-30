/// <reference types="vite/client" />
import { BlockComponent } from '@blocksuite/block-std';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { NoteBlockModel } from './note-model.js';
import type { NoteBlockService } from './note-service.js';

import { KeymapController } from './keymap-controller.js';

@customElement('affine-note')
export class NoteBlockComponent extends BlockComponent<
  NoteBlockModel,
  NoteBlockService
> {
  static override styles = css`
    .affine-note-block-container {
      display: flow-root;
    }
    .affine-note-block-container.selected {
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
      <div class="affine-note-block-container">
        <div class="affine-block-children-container">
          ${this.renderChildren(this.model)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-note': NoteBlockComponent;
  }
}
