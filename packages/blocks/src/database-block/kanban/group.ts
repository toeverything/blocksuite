import './card.js';

import { AddCursorIcon } from '@blocksuite/global/config';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { GroupRenderProps } from '../common/group-by/matcher.js';
import type {
  DataViewKanbanManager,
  KanbanGroupData,
} from './kanban-view-manager.js';

const styles = css`
  affine-data-view-kanban-group {
    width: 200px;
    flex-shrink: 0;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .add-card {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--affine-border-color);
    border-radius: 8px;
    cursor: pointer;
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
    this.view.addCard('end', this.group);
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
    return html`${keyed(
      data.name,
      html` <uni-lit .uni="${data.view}" .props="${props}"></uni-lit>`
    )}`;
  };

  override render() {
    const cards = this.group.rows;

    return html`
      <div>${this.renderTitle()}</div>
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
      <div class="add-card" @click="${this.clickAddCard}">${AddCursorIcon}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-group': KanbanGroup;
  }
}
