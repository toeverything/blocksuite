import './group.js';
import './header.js';
import './drag.js';
import '../common/group-by/define.js';

import { css } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';
import Sortable from 'sortablejs';

import type { KanbanViewSelection } from '../../__internal__/index.js';
import { BaseDataView } from '../common/base-data-view.js';
import { KanbanGroup } from './group.js';
import { KanbanHotkeys } from './hotkeys.js';
import type {
  DataViewKanbanManager,
  GroupHelper,
} from './kanban-view-manager.js';
import { KanbanSelection } from './selection.js';

const styles = css`
  affine-data-view-kanban {
    user-select: none;
  }

  .affine-data-view-kanban-groups {
    display: flex;
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
  @query('.affine-data-view-kanban-groups')
  groups!: HTMLElement;
  groupHelper?: GroupHelper;

  override connectedCallback() {
    super.connectedCallback();
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

  override firstUpdated() {
    const sortable = Sortable.create(this.groups, {
      group: `kanban-group-drag-${this.view.id}`,
      handle: '.group-header',
      draggable: 'affine-data-view-kanban-group',
      animation: 100,
      onEnd: evt => {
        if (evt.item instanceof KanbanGroup) {
          const groups = Array.from(
            this.groups.querySelectorAll('affine-data-view-kanban-group')
          );

          const key =
            evt.newIndex != null
              ? groups[evt.newIndex - 1]?.group.key
              : undefined;
          this.groupHelper?.moveGroupTo(
            evt.item.group.key,
            key
              ? {
                  before: false,
                  id: key,
                }
              : 'start'
          );
        }
      },
    });
    this._disposables.add({
      dispose: () => {
        sortable.destroy();
      },
    });
  }

  override render() {
    this.groupHelper = this.view.groupHelper;
    const groups = this.groupHelper?.groups;
    if (!groups) {
      return html``;
    }
    return html`
      <div class="affine-data-view-kanban-groups">
        ${repeat(
          groups,
          group => group.key,
          group => {
            return html` <affine-data-view-kanban-group
              data-key="${group.key}"
              .view="${this.view}"
              .group="${group}"
            ></affine-data-view-kanban-group>`;
          }
        )}
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
