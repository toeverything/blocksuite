// related component

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { DataViewKanbanManager } from './kanban-view-manager.js';

const styles = css`
  affine-data-view-kanban-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 1px solid var(--affine-border-color);
    border-radius: 8px;
  }
`;

@customElement('affine-data-view-kanban-card')
export class KanbanCard extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewKanbanManager;
  @property({ attribute: false })
  cardId!: string;

  override render() {
    const columns = this.view.columnManagerList;
    return html` <div>
      ${repeat(
        columns,
        v => v.id,
        v => {
          const props = {
            column: v,
            rowId: this.cardId,
            isEditing: false,
            selectCurrentCell: () => {
              //
            },
          };
          return html`<uni-lit
            .uni=${v.renderer.view}
            .props=${props}
          ></uni-lit>`;
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
