import './card.js';

import {
  AddCursorIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from '@blocksuite/global/config';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { GroupRenderProps } from '../common/group-by/matcher.js';
import type {
  DataViewKanbanManager,
  KanbanGroupData,
} from './kanban-view-manager.js';

const styles = css`
  affine-data-view-kanban-group {
    width: 252px;
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
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }

  .group-header-count {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background-color: var(--affine-background-secondary-color);
    display: flex;
    align-items: center;
    justify-content: center;
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
    font-size: 12px;
    line-height: 20px;
    visibility: hidden;
    transition: visibility 100ms ease-in-out;
  }

  affine-data-view-kanban-group:hover .add-card {
    visibility: visible;
  }

  .add-card:hover {
    background-color: var(--affine-hover-color);
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
    const id = this.view.addCard('end', this.group);
    requestAnimationFrame(() => {
      const kanban = this.closest('affine-data-view-kanban');
      if (kanban) {
        kanban.selection.selection = {
          groupKey: this.group.key,
          cardId: id,
          focus: {
            columnId: this.view.header.titleColumn || this.view.columns[0],
            isEditing: true,
          },
        };
      }
    });
  };
  private clickAddCardInStart = () => {
    const id = this.view.addCard('start', this.group);
    requestAnimationFrame(() => {
      const kanban = this.closest('affine-data-view-kanban');
      if (kanban) {
        kanban.selection.selection = {
          groupKey: this.group.key,
          cardId: id,
          focus: {
            columnId: this.view.header.titleColumn || this.view.columns[0],
            isEditing: true,
          },
        };
      }
    });
  };
  private renderTitle = () => {
    const data = this.group.helper.groupData();
    if (!data) {
      return;
    }
    const props: GroupRenderProps = {
      value: this.group.value,
      data: this.group.helper.data,
      updateData: this.group.helper.updateData,
      updateValue: value =>
        this.group.helper.updateValue(this.group.rows, value),
    };
    return html` <uni-lit .uni="${data.view}" .props="${props}"></uni-lit>`;
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

    return html`
      <div class="group-header">
        <div class="group-header-title">
          <div class="group-header-name">${this.renderTitle()}</div>
          ${this.renderCount()}
        </div>
        <div class="group-header-ops">
          <div @click="${this.clickAddCardInStart}" class="group-header-op">
            ${PlusIcon}
          </div>
          <div class="group-header-op">${MoreHorizontalIcon}</div>
        </div>
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
        <div class="add-card" @click="${this.clickAddCard}">
          <div
            style="margin-right: 4px;width: 16px;height: 16px;display:flex;align-items:center;"
          >
            ${AddCursorIcon}
          </div>
          Add
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-group': KanbanGroup;
  }
}
