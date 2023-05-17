// related component
import './table/table-view.js';
import './kanban/kanban-view.js';

import { BlockElement } from '@blocksuite/lit';
import { customElement } from 'lit/decorators.js';
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
  }

  override render() {
    const databaseTag = literal`affine-database-${unsafeStatic(
      this.model.mode
    )}`;

    /* eslint-disable lit/binding-positions, lit/no-invalid-html */
    return html`
      <${databaseTag}
        .root=${this.root}
        .model=${this.model}
        class="affine-block-element"
      ></${databaseTag}>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database': DatabaseBlockComponent;
  }
}
