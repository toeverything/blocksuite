import './group.js';
import './header.js';
import './drag.js';
import '../common/group-by/define.js';

import { css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { KanbanViewSelection } from '../../__internal__/index.js';
import { BaseDataView } from '../common/base-data-view.js';
import { KanbanHotkeys } from './hotkeys.js';
import type { DataViewKanbanManager } from './kanban-view-manager.js';
import { KanbanSelection } from './selection.js';

const styles = css`
  affine-data-view-kanban {
    user-select: none;
  }

  .affine-data-view-kanban-groups {
    display: flex;
    padding: 20px 0;
    gap: 20px;
    overflow-x: auto;
  }
`;

@customElement('affine-data-view-kanban')
export class DataViewKanban extends BaseDataView<
  DataViewKanbanManager,
  KanbanViewSelection
> {
  static override styles = styles;

  selection = new KanbanSelection(this);
  hotkeys = new KanbanHotkeys(this);

  override firstUpdated() {
    this._disposables.add(
      this.view.slots.update.on(() => {
        this.requestUpdate();
        this.querySelectorAll('affine-data-view-kanban-cell').forEach(v => {
          v.cell?.forceUpdate();
          v.requestUpdate();
        });
      })
    );
    this._disposables.add(this.selection.run());
    this._disposables.add(this.hotkeys.run());
  }

  override render() {
    const groups = this.view.groups;
    if (!groups) {
      return html``;
    }
    return html`
      <affine-data-view-kanban-header
        .view="${this.view}"
      ></affine-data-view-kanban-header>
      <div class="affine-data-view-kanban-groups">
        ${repeat(groups, group => {
          return html` <affine-data-view-kanban-group
            data-key="${group.key}"
            .view="${this.view}"
            .group="${group}"
          ></affine-data-view-kanban-group>`;
        })}
      </div>
      <affine-data-view-kanban-drag
        .kanbanView="${this}"
      ></affine-data-view-kanban-drag>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban': DataViewKanban;
  }
}
