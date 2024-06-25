import './cell.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import { NewEditIcon } from '../../../../../_common/icons/index.js';
import { MoreHorizontalIcon } from '../../../common/icons/index.js';
import type { DataViewRenderer } from '../../../data-view.js';
import type {
  DataViewKanbanColumnManager,
  DataViewKanbanManager,
} from './kanban-view-manager.js';
import { openDetail, popCardMenu } from './menu.js';

const styles = css`
  affine-data-view-kanban-card {
    display: flex;
    position: relative;
    flex-direction: column;
    border: 1px solid var(--affine-border-color);
    box-shadow: 0px 2px 3px 0px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    transition: background-color 100ms ease-in-out;
    background-color: var(--affine-background-kanban-card-color);
  }

  affine-data-view-kanban-card:hover {
    background-color: var(--affine-hover-color);
  }

  affine-data-view-kanban-card .card-header {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  affine-data-view-kanban-card .card-header-title uni-lit {
    width: 100%;
  }

  .card-header.has-divider {
    border-bottom: 0.5px solid var(--affine-border-color);
  }

  affine-data-view-kanban-card .card-header-title {
    font-size: var(--data-view-cell-text-size);
    line-height: var(--data-view-cell-text-line-height);
  }

  affine-data-view-kanban-card .card-header-icon {
    padding: 4px;
    background-color: var(--affine-background-secondary-color);
    display: flex;
    align-items: center;
    border-radius: 4px;
    width: max-content;
  }

  affine-data-view-kanban-card .card-header-icon svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
    color: var(--affine-icon-color);
  }

  affine-data-view-kanban-card .card-body {
    display: flex;
    flex-direction: column;
    padding: 8px;
    gap: 4px;
  }

  affine-data-view-kanban-card:hover .card-ops {
    visibility: visible;
  }

  .card-ops {
    position: absolute;
    right: 8px;
    top: 8px;
    visibility: hidden;
    display: flex;
    gap: 4px;
    cursor: pointer;
  }

  .card-op {
    display: flex;
    position: relative;
    padding: 4px;
    border-radius: 4px;
    box-shadow: 0px 0px 4px 0px rgba(66, 65, 73, 0.14);
    background-color: var(--affine-background-primary-color);
  }

  .card-op:hover:before {
    content: '';
    border-radius: 4px;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background-color: var(--affine-hover-color);
  }

  .card-op svg {
    fill: var(--affine-icon-color);
    color: var(--affine-icon-color);
    width: 16px;
    height: 16px;
  }
`;

@customElement('affine-data-view-kanban-card')
export class KanbanCard extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  accessor dataViewEle!: DataViewRenderer;

  @property({ attribute: false })
  accessor view!: DataViewKanbanManager;

  @property({ attribute: false })
  accessor groupKey!: string;

  @property({ attribute: false })
  accessor cardId!: string;

  @state()
  accessor isFocus = false;

  private renderTitle() {
    const title = this.view.getHeaderTitle(this.cardId);
    if (!title) {
      return;
    }
    return html` <div class="card-header-title">
      <affine-data-view-kanban-cell
        .contentOnly="${true}"
        data-column-id="${title.id}"
        .view="${this.view}"
        .groupKey="${this.groupKey}"
        .column="${title}"
        .cardId="${this.cardId}"
      ></affine-data-view-kanban-cell>
    </div>`;
  }

  private renderIcon() {
    const icon = this.view.getHeaderIcon(this.cardId);
    if (!icon) {
      return;
    }
    return html` <div class="card-header-icon">
      ${icon.getValue(this.cardId)}
    </div>`;
  }

  private renderHeader(columns: DataViewKanbanColumnManager[]) {
    if (!this.view.hasHeader(this.cardId)) {
      return '';
    }
    const classList = classMap({
      'card-header': true,
      'has-divider': columns.length > 0,
    });
    return html`
      <div class="${classList}">${this.renderTitle()} ${this.renderIcon()}</div>
    `;
  }

  private renderBody(columns: DataViewKanbanColumnManager[]) {
    if (columns.length === 0) {
      return '';
    }
    return html` <div class="card-body">
      ${repeat(
        columns,
        v => v.id,
        column => {
          if (this.view.isInHeader(column.id)) {
            return '';
          }
          return html` <affine-data-view-kanban-cell
            .contentOnly="${false}"
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

  private renderOps() {
    if (this.view.readonly) {
      return;
    }
    return html`
      <div class="card-ops">
        <div class="card-op" @click="${this.clickEdit}">${NewEditIcon}</div>
        <div class="card-op" @click="${this.clickMore}">
          ${MoreHorizontalIcon}
        </div>
      </div>
    `;
  }

  private clickEdit = (e: MouseEvent) => {
    e.stopPropagation();
    const selection = this.getSelection();
    if (selection) {
      openDetail(this.dataViewEle, this.cardId, selection);
    }
  };

  private getSelection() {
    return this.closest('affine-data-view-kanban')?.selectionController;
  }

  private clickMore = (e: MouseEvent) => {
    e.stopPropagation();
    const selection = this.getSelection();
    const ele = e.currentTarget as HTMLElement;
    if (selection) {
      selection.selection = {
        selectionType: 'card',
        cards: [
          {
            groupKey: this.groupKey,
            cardId: this.cardId,
          },
        ],
      };
      popCardMenu(this.dataViewEle, ele, this.cardId, selection);
    }
  };

  private contextMenu = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const selection = this.getSelection();
    if (selection) {
      selection.selection = {
        selectionType: 'card',
        cards: [
          {
            groupKey: this.groupKey,
            cardId: this.cardId,
          },
        ],
      };
      popCardMenu(
        this.dataViewEle,
        e.target as HTMLElement,
        this.cardId,
        selection
      );
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.view.slots.update.on(() => {
        this.requestUpdate();
      })
    );
    if (this.view.readonly) {
      return;
    }
    this._disposables.addFromEvent(this, 'contextmenu', e => {
      this.contextMenu(e);
    });
    this._disposables.addFromEvent(this, 'click', e => {
      if (e.shiftKey) {
        this.getSelection()?.shiftClickCard(e);
        return;
      }
      const selection = this.getSelection();
      const preSelection = selection?.selection;

      if (preSelection?.selectionType !== 'card') return;

      if (selection) {
        selection.selection = undefined;
      }
      this.dataViewEle.openDetailPanel({
        view: this.view,
        rowId: this.cardId,
        onClose: () => {
          if (selection) {
            selection.selection = preSelection;
          }
        },
      });
    });
  }

  override render() {
    const columns = this.view.columnManagerList.filter(
      v => !this.view.isInHeader(v.id)
    );
    this.style.border = this.isFocus
      ? '1px solid var(--affine-primary-color)'
      : '';
    return html`
      ${this.renderHeader(columns)} ${this.renderBody(columns)}
      ${this.renderOps()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-card': KanbanCard;
  }
}
