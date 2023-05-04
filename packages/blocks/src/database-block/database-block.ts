// related component
import './table/table-block.js';
import './kanban/kanban-block.js';

import { customElement, property } from 'lit/decorators.js';
import { html, literal, unsafeStatic } from 'lit/static-html.js';

import { type BlockHost } from '../__internal__/index.js';
import { ShadowlessElement } from '../__internal__/utils/lit.js';
import type { DatabaseBlockModel } from './database-model.js';

@customElement('affine-database')
export class DatabaseBlockComponent extends ShadowlessElement {
  @property()
  model!: DatabaseBlockModel;

  @property()
  host!: BlockHost;

  override connectedCallback() {
    super.connectedCallback();

    this.model.propsUpdated.on(() => this.requestUpdate());
  }

  override render() {
    const databaseTag = literal`affine-database-${unsafeStatic(
      this.model.mode
    )}`;

    /* eslint-disable lit/binding-positions, lit/no-invalid-html */
    return html`
      <${databaseTag}
        .model=${this.model}
        .host=${this.host}
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
