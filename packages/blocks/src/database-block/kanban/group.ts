import './card.js';

import { AddCursorIcon } from '@blocksuite/global/config';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

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
    gap: 12px;
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
  override render() {
    const cards = this.group.rows;
    return html`
      <div>${this.group.value ?? 'No ' + 'Tags'}</div>
      ${repeat(
        cards,
        id => id,
        id => {
          return html`
            <affine-data-view-kanban-card
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
