import { BlockComponent } from '@blocksuite/block-std';
import { customElement, property } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { DatabaseBlockModel } from '../../database-model.js';

import {
  DatabaseTableViewClose,
  DatabaseTableViewIcon,
} from '../../data-view/common/icons/index.js';
import { fullScreenStyles } from './styles.js';

@customElement('affine-database-table-view-full-screen')
export class DatabaseTableViewFullScreen extends BlockComponent<DatabaseBlockModel> {
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

  static override styles = fullScreenStyles;

  close = () => {
    this.abortController.abort();
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

  @property({ attribute: false })
  accessor abortController!: AbortController;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-table-view-full-screen': DatabaseTableViewFullScreen;
  }
}
