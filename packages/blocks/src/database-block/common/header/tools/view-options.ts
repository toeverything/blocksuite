import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { eventToVRect, popMenu } from '../../../../components/menu/menu.js';
import {
  DeleteIcon,
  DuplicateIcon,
  FilterIcon,
  GroupingIcon,
  InfoIcon,
  MoreHorizontalIcon,
} from '../../../../icons/index.js';
import { DataViewKanbanManager } from '../../../kanban/kanban-view-manager.js';
import { popFilterModal } from '../../filter/filter-modal.js';
import { groupByMatcher } from '../../group-by/matcher.js';
import { popPropertiesSetting } from '../../properties.js';
import { BaseTool } from './base-tool.js';

const styles = css`
  .affine-database-toolbar-item.more-action {
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .affine-database-toolbar-item.more-action:hover {
    background: var(--affine-hover-color);
  }

  .affine-database-toolbar-item.more-action svg {
    width: 20px;
    height: 20px;
    fill: var(--affine-icon-color);
  }

  .more-action.active {
    background: var(--affine-hover-color);
  }
`;

@customElement('data-view-header-tools-view-options')
export class DataViewHeaderToolsViewOptions extends BaseTool<DataViewKanbanManager> {
  static override styles = styles;

  @query('.more-action')
  private _moreActionContainer!: HTMLDivElement;

  showToolBar(show: boolean) {
    const tools = this.closest('data-view-header-tools');
    if (tools) {
      tools.showToolBar = show;
    }
  }

  private _clickMoreAction = (e: MouseEvent) => {
    e.stopPropagation();
    this.showToolBar(true);
    popMenu(this._moreActionContainer, {
      options: {
        input: {
          initValue: this.view.name,
          onComplete: text => {
            this.view.updateName(text);
          },
        },
        items: [
          {
            type: 'action',
            name: 'Properties',
            icon: InfoIcon,
            select: () => {
              requestAnimationFrame(() => {
                this.showToolBar(true);
                popPropertiesSetting(this._moreActionContainer, {
                  view: this.view,
                  onClose: () => this.showToolBar(false),
                });
              });
            },
          },
          {
            type: 'action',
            name: 'Filter',
            icon: FilterIcon,
            select: () => {
              popFilterModal(eventToVRect(e), {
                vars: this.view.vars,
                value: this.view.filter,
                onChange: this.view.updateFilter.bind(this.view),
                isRoot: true,
                onDelete: () => {
                  this.view.updateFilter({
                    ...this.view.filter,
                    conditions: [],
                  });
                },
              });
            },
          },
          {
            type: 'sub-menu',
            name: 'Group By',
            icon: GroupingIcon,
            hide: () => !(this.view instanceof DataViewKanbanManager),
            options: {
              input: {
                search: true,
                placeholder: 'Search',
              },
              items: this.view.columnsWithoutFilter
                .filter(id => {
                  if (this.view.columnGet(id).type === 'title') {
                    return false;
                  }
                  return !!groupByMatcher.match(
                    this.view.columnGet(id).dataType
                  );
                })
                .map(id => {
                  const column = this.view.columnGet(id);
                  return {
                    type: 'action',
                    name: column.name,
                    icon: html` <uni-lit .uni="${column.icon}"></uni-lit>`,
                    select: () => {
                      this.view.changeGroup(id);
                    },
                  };
                }),
            },
          },

          {
            type: 'action',
            name: 'Duplicate',
            icon: DuplicateIcon,
            select: () => {
              this.view.duplicateView();
            },
            class: 'delete-item',
          },
          {
            type: 'group',
            name: '',
            children: () => [
              {
                type: 'action',
                name: 'Delete View',
                icon: DeleteIcon,
                select: () => {
                  this.view.deleteView();
                },
                class: 'delete-item',
              },
            ],
          },
        ],
        onClose: () => {
          this.showToolBar(false);
        },
      },
    });
  };

  override render() {
    if (this.view.readonly) {
      return;
    }
    return html` <div
      class="affine-database-toolbar-item more-action dv-icon-20"
      @click="${this._clickMoreAction}"
    >
      ${MoreHorizontalIcon}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-view-options': DataViewHeaderToolsViewOptions;
  }
}
