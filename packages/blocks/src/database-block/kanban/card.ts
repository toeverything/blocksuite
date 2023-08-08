import './cell.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import { popSideDetail } from '../common/detail/layout.js';
import type { DataViewKanbanManager } from './kanban-view-manager.js';

const styles = css`
  affine-data-view-kanban-card {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--affine-border-color);
    box-shadow: 0px 2px 3px 0px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    transition: background-color 100ms ease-in-out;
  }

  affine-data-view-kanban-card:hover {
    background-color: var(--affine-hover-color);
  }

  affine-data-view-kanban-card .card-header {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-bottom: 0.5px solid var(--affine-border-color);
  }

  affine-data-view-kanban-card .card-header-title {
    font-size: 12px;
    line-height: 20px;
  }

  affine-data-view-kanban-card .card-body {
    display: flex;
    flex-direction: column;
    padding: 8px;
    gap: 4px;
  }
`;

@customElement('affine-data-view-kanban-card')
export class KanbanCard extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewKanbanManager;
  @property({ attribute: false })
  groupKey!: string;
  @property({ attribute: false })
  cardId!: string;
  @state()
  isFocus = false;

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(this, 'click', e => {
      popSideDetail({
        view: this.view,
        rowId: this.cardId,
      });
    });
  }

  private renderTitle() {
    const title = this.view.getHeaderTitle(this.cardId);
    if (!title) {
      return;
    }
    return html` <div class="card-header-title">
      <affine-data-view-kanban-cell
        .contentOnly=${true}
        data-column-id="${title.id}"
        .view="${this.view}"
        .groupKey="${this.groupKey}"
        .column="${title}"
        .cardId="${this.cardId}"
      ></affine-data-view-kanban-cell>
    </div>`;
  }

  private renderHeader() {
    if (!this.view.hasHeader(this.cardId)) {
      return '';
    }

    return html` <div class="card-header">${this.renderTitle()}</div> `;
  }

  override render() {
    const columns = this.view.columnManagerList;
    this.style.border = this.isFocus
      ? '1px solid var(--affine-primary-color)'
      : '';
    return html` ${this.renderHeader()}
      <div class="card-body">
        ${repeat(
          columns,
          v => v.id,
          column => {
            if (this.view.isInHeader(column.id)) {
              return '';
            }
            return html` <affine-data-view-kanban-cell
              data-column-id="${column.id}"
              .view="${this.view}"
              .groupKey="${this.groupKey}"
              .column="${column}"
              .cardId="${this.cardId}"
            ></affine-data-view-kanban-cell>`;
          }
        )}
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-card': KanbanCard;
  }
}
