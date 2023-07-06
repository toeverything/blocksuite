// related component
import '../database-block/table/table-view.js';
import '../database-block/common/database-view-header.js';

import { BlockElement } from '@blocksuite/lit';
import { customElement, property, state } from 'lit/decorators.js';
import { html, literal, unsafeStatic } from 'lit/static-html.js';

import { registerService } from '../__internal__/service.js';
import type { DataViewBlockModel } from './data-view-model.js';
import { DataViewBlockService } from './data-view-service.js';

@customElement('affine-data-view')
export class DataViewBlockComponent extends BlockElement<DataViewBlockModel> {
  override connectedCallback() {
    super.connectedCallback();

    registerService('affine:data-view', DataViewBlockService);
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.currentView = this.model.views[0].id;
  }

  @property({ attribute: false })
  modalMode?: boolean;

  @state()
  currentView?: string;

  _setViewId = (viewId: string) => {
    this.currentView = viewId;
  };

  override render() {
    const views = this.model.views;
    const current = views.find(v => v.id === this.currentView) ?? views[0];
    const databaseTag = literal`affine-database-${unsafeStatic(current.type)}`;
    const view = this.model.page.awarenessStore.getFlag(
      'enable_database_filter'
    )
      ? html`<database-view-header
          .currentView="${current.id}"
          .setViewId="${this._setViewId}"
          .model=${this.model}
        ></database-view-header>`
      : '';
    /* eslint-disable lit/binding-positions, lit/no-invalid-html */
    return html`
      <div>
        ${view}
        <${databaseTag}
          .root='${this.root}'
          .model='${this.model}'
          .view='${current}'
          .modalMode=${this.modalMode}
          class='affine-block-element'
        ></${databaseTag}>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view': DataViewBlockComponent;
  }
}
