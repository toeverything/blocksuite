import { BlockElement } from '@blocksuite/block-std';
import { customElement, property } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import {
  DatabaseTableViewClose,
  DatabaseTableViewIcon,
} from '../../data-view/common/icons/index.js';
import type { DatabaseBlockModel } from '../../database-model.js';
import { fullScreenStyles } from './styles.js';

@customElement('affine-database-table-view-full-screen')
export class DatabaseTableViewFullScreen extends BlockElement<DatabaseBlockModel> {
  static override styles = fullScreenStyles;

  @property({ attribute: false })
  accessor abortController!: AbortController;

  close = () => {
    this.abortController.abort();
  };

  _renderView = () => {
    /* eslint-disable lit/binding-positions, lit/no-invalid-html */
    return html`
      <affine-database
        class="affine-block-element"
        .modalMode=${true}
        .host=${this.host}
        .model=${this.model}
      ></affine-database>
    `;
  };

  override renderBlock() {
    return html`<div class="table-view-full-modal-overlay">
      <div class="table-view-full-modal-container">
        <div class="table-view-full-header">
          <div class="titles">
            <span class="title">${this.doc.meta?.title ?? ''}</span>
            <span class="separator">/</span>
            <span class="title"
              >${DatabaseTableViewIcon}${this.model.title.toString()}</span
            >
          </div>
          <div class="close" @click=${this.close}>
            ${DatabaseTableViewClose}
          </div>
        </div>
        <div class="table-view-full-content">${this._renderView()}</div>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-table-view-full-screen': DatabaseTableViewFullScreen;
  }
}
