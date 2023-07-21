import './card.js';

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
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
`;

@customElement('affine-data-view-kanban-group')
export class KanbanGroup extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewKanbanManager;
  @property({ attribute: false })
  group!: KanbanGroupData;

  override render() {
    const cards = this.group.rows;
    return html`
      <div>
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
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-group': KanbanGroup;
  }
}
