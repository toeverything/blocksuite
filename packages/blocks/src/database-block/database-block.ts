// related component
import './table/table-view.js';
import './kanban/kanban-view.js';
import './common/database-view-header.js';

import { BlockElement } from '@blocksuite/lit';
import { customElement, state } from 'lit/decorators.js';
import { html, literal, unsafeStatic } from 'lit/static-html.js';

import { registerService } from '../__internal__/service.js';
import type { DatabaseBlockModel } from './database-model.js';
import { DatabaseBlockService } from './database-service.js';

@customElement('affine-database')
export class DatabaseBlockComponent extends BlockElement<DatabaseBlockModel> {
  override connectedCallback() {
    super.connectedCallback();

    registerService('affine:database', DatabaseBlockService);
    this.model.propsUpdated.on(() => this.requestUpdate());
    this.currentView = this.model.getViewList()[0].id;
  }

  @state()
  currentView?: string;

  override render() {
    const views = this.model.getViewList();
    const current = views.find(v => v.id === this.currentView) ?? views[0];

    const databaseTag = literal`affine-database-${unsafeStatic(current.mode)}`;

    /* eslint-disable lit/binding-positions, lit/no-invalid-html */
    return html`
      <div>
        <database-view-header .currentView='${this.currentView}' .model='${this.model}'></database-view-header>
        <${databaseTag}
          .root='${this.root}'
          .model='${this.model}'
          .view='${current}'
          class='affine-block-element'
        ></${databaseTag}>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database': DatabaseBlockComponent;
  }
}
