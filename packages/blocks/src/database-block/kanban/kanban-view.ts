// related component
import './components/column-container.js';

import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import { type BlockHost, WithDisposable } from '../../__internal__/index.js';
import { ShadowlessElement } from '../../__internal__/utils/lit.js';
import type { DatabaseBlockModel } from '../database-model.js';

const styles = css`
  affine-database-kanban {
    padding: 20px 0;
    overflow-x: scroll;
  }

  .affine-database-kanban-content {
    display: flex;
    gap: 12px;
  }
`;

@customElement('affine-database-kanban')
export class DatabaseKanban
  extends WithDisposable(ShadowlessElement)
  implements BlockHost
{
  flavour = 'affine:database' as const;

  static override styles = styles;

  get slots() {
    return this.host.slots;
  }

  get page() {
    return this.host.page;
  }
  get clipboard() {
    return this.host.clipboard;
  }
  get getService() {
    return this.host.getService;
  }

  @property()
  model!: DatabaseBlockModel;

  @property()
  host!: BlockHost;

  override connectedCallback() {
    super.connectedCallback();
  }

  override render() {
    const columns = this.model.getKanbanCategories();

    return html`<div class="affine-database-kanban">
      <div class="affine-database-kanban-content">
        ${repeat(
          columns,
          column => column.index,
          (column, index) => {
            return html`<affine-database-kanban-column-container
              .index=${index}
              .column=${column}
            ></affine-database-kanban-column-container>`;
          }
        )}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-kanban': DatabaseKanban;
  }
}
