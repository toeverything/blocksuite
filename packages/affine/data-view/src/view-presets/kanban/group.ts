import { popFilterableSimpleMenu } from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { AddCursorIcon } from '@blocksuite/icons/lit';
import { css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { GroupData } from '../../core/common/group-by/helper.js';
import type { DataViewRenderer } from '../../core/data-view.js';
import type { KanbanSingleView } from './kanban-view-manager.js';

import { GroupTitle } from '../../core/common/group-by/group-title.js';

const styles = css`
  affine-data-view-kanban-group {
    width: 260px;
    flex-shrink: 0;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
  }

  .group-header {
    height: 32px;
    padding: 6px 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    overflow: hidden;
  }

  .group-header-title {
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--data-view-cell-text-size);
  }

  affine-data-view-kanban-group:hover .group-header-op {
    visibility: visible;
    opacity: 1;
  }

  .group-body {
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    padding: 0 4px;
    gap: 12px;
  }

  .add-card {
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    font-size: var(--data-view-cell-text-size);
    line-height: var(--data-view-cell-text-line-height);
    visibility: hidden;
    opacity: 0;
    transition: all 150ms cubic-bezier(0.42, 0, 1, 1);
    color: var(--affine-text-secondary-color);
  }

  affine-data-view-kanban-group:hover .add-card {
    visibility: visible;
    opacity: 1;
  }

  affine-data-view-kanban-group .add-card:hover {
    background-color: var(--affine-hover-color);
    color: var(--affine-text-primary-color);
  }

  .sortable-ghost {
    background-color: var(--affine-hover-color);
    opacity: 0.5;
  }

  .sortable-drag {
    background-color: var(--affine-background-primary-color);
  }
`;

export class KanbanGroup extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  private clickAddCard = () => {
    const id = this.view.addCard('end', this.group.key);
    requestAnimationFrame(() => {
      const kanban = this.closest('affine-data-view-kanban');
      if (kanban) {
        kanban.selectionController.selection = {
          selectionType: 'cell',
          groupKey: this.group.key,
          cardId: id,
          columnId:
            this.view.mainProperties$.value.titleColumn ||
            this.view.propertyIds$.value[0],
          isEditing: true,
        };
      }
    });
  };

  private clickAddCardInStart = () => {
    const id = this.view.addCard('start', this.group.key);
    requestAnimationFrame(() => {
      const kanban = this.closest('affine-data-view-kanban');
      if (kanban) {
        kanban.selectionController.selection = {
          selectionType: 'cell',
          groupKey: this.group.key,
          cardId: id,
          columnId:
            this.view.mainProperties$.value.titleColumn ||
            this.view.propertyIds$.value[0],
          isEditing: true,
        };
      }
    });
  };

  private clickGroupOptions = (e: MouseEvent) => {
    const ele = e.currentTarget as HTMLElement;
    popFilterableSimpleMenu(ele, [
      {
        type: 'action',
        name: 'Ungroup',
        hide: () => this.group.value == null,
        select: () => {
          this.group.rows.forEach(id => {
            this.group.manager.removeFromGroup(id, this.group.key);
          });
        },
      },
      {
        type: 'action',
        name: 'Delete Cards',
        select: () => {
          this.view.rowDelete(this.group.rows);
        },
      },
    ]);
  };

  override render() {
    const cards = this.group.rows;
    return html`
      <div class="group-header">
        ${GroupTitle(this.group, {
          readonly: this.view.readonly$.value,
          clickAdd: this.clickAddCardInStart,
          clickOps: this.clickGroupOptions,
        })}
      </div>
      <div class="group-body">
        ${repeat(
          cards,
          id => id,
          id => {
            return html`
              <affine-data-view-kanban-card
                data-card-id="${id}"
                .groupKey="${this.group.key}"
                .dataViewEle="${this.dataViewEle}"
                .view="${this.view}"
                .cardId="${id}"
              ></affine-data-view-kanban-card>
            `;
          }
        )}
        ${this.view.readonly$.value
          ? nothing
          : html`<div class="add-card" @click="${this.clickAddCard}">
              <div
                style="margin-right: 4px;width: 16px;height: 16px;display:flex;align-items:center;"
              >
                ${AddCursorIcon()}
              </div>
              Add
            </div>`}
      </div>
    `;
  }

  @property({ attribute: false })
  accessor dataViewEle!: DataViewRenderer;

  @property({ attribute: false })
  accessor group!: GroupData;

  @property({ attribute: false })
  accessor view!: KanbanSingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-group': KanbanGroup;
  }
}
