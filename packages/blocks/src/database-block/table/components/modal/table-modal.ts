import '../../../../components/button.js';

import { BlockElement } from '@blocksuite/lit';
import { customElement, property } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import {
  DatabaseExpand,
  DatabaseTableViewClose,
} from '../../../../icons/index.js';
import type { DatabaseBlockModel } from '../../../database-model.js';
import { showDatabaseTableViewFullModal } from './index.js';
import { modelStyles } from './styles.js';

@customElement('affine-database-table-view-modal')
export class DatabaseTableViewModal extends BlockElement<DatabaseBlockModel> {
  static override styles = modelStyles;

  @property({ attribute: false })
  abortController!: AbortController;

  close = () => {
    this.abortController.abort();
  };

  private _onFullWidth = () => {
    showDatabaseTableViewFullModal({
      page: this.page,
      root: this.root,
      model: this.model,
    });

    this.close();
  };

  private _renderView = () => {
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
          <icon-button class="action-button" @click=${this._onFullWidth}
            >${DatabaseExpand}</icon-button
          >
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
