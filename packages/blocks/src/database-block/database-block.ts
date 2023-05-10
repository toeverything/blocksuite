// related component
import './table/table-view.js';
import './kanban/kanban-view.js';

import type { BlockSuiteRoot } from '@blocksuite/lit';
import { customElement, property } from 'lit/decorators.js';
import { html, literal, unsafeStatic } from 'lit/static-html.js';

import { ShadowlessElement } from '../__internal__/utils/lit.js';
import type { DatabaseBlockModel } from './database-model.js';

@customElement('affine-database')
export class DatabaseBlockComponent extends ShadowlessElement {
  @property()
  model!: DatabaseBlockModel;

  @property()
  root!: BlockSuiteRoot;

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
