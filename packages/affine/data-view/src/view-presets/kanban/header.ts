import { popMenu } from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { css } from 'lit';
import { property } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import type { KanbanSingleView } from './kanban-view-manager.js';

const styles = css`
  affine-data-view-kanban-header {
    display: flex;
    justify-content: space-between;
    padding: 4px;
  }

  .select-group {
    border-radius: 8px;
    padding: 4px 8px;
    cursor: pointer;
  }

  .select-group:hover {
    background-color: var(--affine-hover-color);
  }
`;

export class KanbanHeader extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = styles;

  private clickGroup = (e: MouseEvent) => {
    popMenu(e.target as HTMLElement, {
      options: {
        input: {
          search: true,
        },
        items: this.view.properties$.value
          .filter(column => column.id !== this.view.view?.groupBy?.columnId)
          .map(column => {
            return {
              type: 'action',
              name: column.name$.value,
              select: () => {
                this.view.changeGroup(column.id);
              },
            };
          }),
      },
    });
  };

  override render() {
    return html`
      <div></div>
      <div>
        <div class="select-group" @click="${this.clickGroup}">Group</div>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor view!: KanbanSingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban-header': KanbanHeader;
  }
}
