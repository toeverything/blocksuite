import './group.js';
import './header.js';
import './drag.js';
import '../common/group-by/define.js';

import type { WheelEvent } from 'happy-dom';
import { css } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';
import Sortable from 'sortablejs';

import type { KanbanViewSelectionWithType } from '../../__internal__/index.js';
import { popMenu } from '../../components/menu/index.js';
import { renderUniLit } from '../../components/uni-component/uni-component.js';
import { AddCursorIcon } from '../../icons/index.js';
import { BaseDataView } from '../common/base-data-view.js';
import { KanbanViewClipboard } from './clipboard.js';
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
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .affine-data-view-kanban-groups {
    display: flex;
    gap: 20px;
    overflow: auto;
  }

  .add-group-icon {
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .add-group-icon:hover {
    background-color: var(--affine-hover-color);
  }

  .add-group-icon svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
    color: var(--affine-icon-color);
  }
`;

@customElement('affine-data-view-kanban')
export class DataViewKanban extends BaseDataView<
  DataViewKanbanManager,
  KanbanViewSelectionWithType
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
      })
    );
    this.selection
      .run()
      .forEach(disposable => this._disposables.add(disposable));
    this._disposables.add(this.hotkeys.run());

    // init clipboard
    const clipboard = new KanbanViewClipboard({
      view: this,
      data: this.view,
      disposables: this._disposables,
    });
    clipboard.init();
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

  renderAddGroup = () => {
    const addGroup = this.groupHelper?.addGroup;
    if (!addGroup) {
      return;
    }
    const add = (e: MouseEvent) => {
      const ele = e.currentTarget as HTMLElement;
      popMenu(ele, {
        options: {
          input: {
            onComplete: text => {
              const column = this.groupHelper?.column;
              if (column) {
                column.updateData(() => addGroup(text, column.data) as never);
              }
            },
          },
          items: [],
        },
      });
    };
    return html` <div
      style="height: 32px;width: 100px;flex-shrink:0;display:flex;align-items:center;"
      @click="${add}"
    >
      <div class="add-group-icon">${AddCursorIcon}</div>
    </div>`;
  };
  onWheel = (event: WheelEvent) => {
    const ele = event.currentTarget;
    if (ele instanceof HTMLElement) {
      if (ele.scrollWidth === ele.clientWidth) {
        return;
      }
      event.stopPropagation();
    }
  };
  override render() {
    this.groupHelper = this.view.groupHelper;
    const groups = this.groupHelper?.groups;
    if (!groups) {
      return html``;
    }

    return html`
      ${renderUniLit(this.header, { view: this.view, viewMethods: this })}
      <div class="affine-data-view-kanban-groups" @wheel="${this.onWheel}">
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
        ${this.renderAddGroup()}
      </div>
      <affine-data-view-kanban-drag
        .kanbanView="${this}"
      ></affine-data-view-kanban-drag>
    `;
  }

  focusFirstCell(): void {
    this.selection.focusFirstCell();
  }

  getSelection() {
    return this.selection.selection;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-data-view-kanban': DataViewKanban;
  }
}
