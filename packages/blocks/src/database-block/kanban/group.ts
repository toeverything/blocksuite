import './card.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import { popFilterableSimpleMenu } from '../../components/menu/index.js';
import { renderUniLit } from '../../components/uni-component/uni-component.js';
import {
  AddCursorIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from '../../icons/index.js';
import type { GroupRenderProps } from '../common/group-by/matcher.js';
import type {
  DataViewKanbanManager,
  KanbanGroupData,
} from './kanban-view-manager.js';

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
  }

  .group-header-title {
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--data-view-cell-text-size);
  }
  .group-header-name {
    flex: 1;
    overflow: hidden;
  }

  .group-header-icon {
    display: flex;
    align-items: center;
    margin-right: -4px;
  }

  .group-header-icon svg {
    width: 16px;
    height: 16px;
    color: var(--affine-icon-color);
    fill: var(--affine-icon-color);
  }

  .group-header-count {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background-color: var(--affine-background-secondary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--affine-text-secondary-color);
  }

  .group-header-ops {
    display: flex;
    align-items: center;
  }

  .group-header-op {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    visibility: hidden;
    transition: visibility 100ms ease-in-out;
  }

  affine-data-view-kanban-group:hover .group-header-op {
    visibility: visible;
  }

  .group-header-op:hover {
    background-color: var(--affine-hover-color);
  }

  .group-header-op svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
    color: var(--affine-icon-color);
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
    height: 28px;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    font-size: var(--data-view-cell-text-size);
    line-height: var(--data-view-cell-text-line-height);
    visibility: hidden;
    transition: visibility 100ms ease-in-out;
  }

  affine-data-view-kanban-group:hover .add-card {
    visibility: visible;
  }

  .add-card:hover {
    background-color: var(--affine-hover-color);
  }

  .sortable-ghost {
    background-color: var(--affine-hover-color);
    opacity: 0.5;
  }

  .sortable-drag {
    background-color: var(--affine-background-primary-color);
  }
`;

@customElement('affine-data-view-kanban-group')
export class KanbanGroup extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewKanbanManager;
  @property({ attribute: false })
  group!: KanbanGroupData;
  private clickAddCard = () => {
    const id = this.view.addCard('end', this.group.key);
    requestAnimationFrame(() => {
      const kanban = this.closest('affine-data-view-kanban');
      if (kanban) {
        kanban.selection.selection = {
          selectionType: 'cell',
          groupKey: this.group.key,
          cardId: id,
          columnId: this.view.header.titleColumn || this.view.columns[0],
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
        kanban.selection.selection = {
          selectionType: 'cell',
          groupKey: this.group.key,
          cardId: id,
          columnId: this.view.header.titleColumn || this.view.columns[0],
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
            this.group.helper.removeFromGroup(id, this.group.key);
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
  private renderTitle = () => {
    const data = this.group.helper.groupConfig();
    if (!data) {
      return;
    }
    const props: GroupRenderProps = {
      value: this.group.value,
      data: this.group.helper.data,
      updateData: this.group.helper.updateData,
      updateValue: value =>
        this.group.helper.updateValue(this.group.rows, value),
      readonly: this.view.readonly,
    };
    return renderUniLit(data.view, props);
  };

  renderCount() {
    const cards = this.group.rows;
    if (!cards.length) {
      return;
    }
    return html` <div class="group-header-count">${cards.length}</div>`;
  }

  override render() {
    const cards = this.group.rows;
    const icon =
      this.group.value == null
        ? ''
        : html` <uni-lit
            class="group-header-icon"
            .uni="${this.group.helper.column.icon}"
          ></uni-lit>`;
    return html`
      <div class="group-header">
        <div class="group-header-title">
          ${icon}
          <div class="group-header-name">${this.renderTitle()}</div>
          ${this.renderCount()}
        </div>
        ${this.view.readonly
          ? nothing
          : html`<div class="group-header-ops">
              <div @click="${this.clickAddCardInStart}" class="group-header-op">
                ${PlusIcon}
              </div>
              <div @click="${this.clickGroupOptions}" class="group-header-op">
                ${MoreHorizontalIcon}
              </div>
            </div>`}
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
                .view="${this.view}"
                .cardId="${id}"
              ></affine-data-view-kanban-card>
            `;
          }
        )}
        ${this.view.readonly
          ? nothing
          : html`<div class="add-card" @click="${this.clickAddCard}">
              <div
                style="margin-right: 4px;width: 16px;height: 16px;display:flex;align-items:center;"
              >
                ${AddCursorIcon}
              </div>
              Add
            </div>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-group': KanbanGroup;
  }
}
