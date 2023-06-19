import '../../../../components/button.js';

import {
  DatabaseExpand,
  DatabaseTableViewClose,
} from '@blocksuite/global/config';
import { BlockElement } from '@blocksuite/lit';
import { customElement, property } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { DatabaseBlockModel } from '../../../database-model.js';
import { styles } from './styles.js';

@customElement('affine-database-table-view-modal')
export class DatabaseTableViewModal extends BlockElement<DatabaseBlockModel> {
  static override styles = styles;

  @property()
  abortController!: AbortController;

  close = () => {
    this.abortController.abort();
  };

  _renderView = () => {
    /* eslint-disable lit/binding-positions, lit/no-invalid-html */
    return html`
      <affine-database
        class="affine-block-element"
        .modalMode=${true}
        .root=${this.root}
        .model=${this.model}
      ></affine-database>
    `;
  };

  override render() {
    return html`<div class="table-view-modal-overlay">
      <div class="table-view-modal-overlay-mask" @click=${this.close}></div>
      <div class="table-view-modal-container">
        <div class="table-view-content">${this._renderView()}</div>
        <div class="action-buttons">
          <icon-button class="action-button" @click=${this.close}
            >${DatabaseTableViewClose}</icon-button
          >
          <icon-button class="action-button">${DatabaseExpand}</icon-button>
        </div>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-table-view-modal': DatabaseTableViewModal;
  }
}
