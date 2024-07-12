import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { DataViewKanbanManager } from '../../../../view/presets/kanban/kanban-view-manager.js';
import type { DataViewTableManager } from '../../../../view/presets/table/table-view-manager.js';

import { popMenu } from '../../../../../../_common/components/index.js';
import {
  ArrowRightSmallIcon,
  DeleteIcon,
  DuplicateIcon,
  MoreHorizontalIcon,
} from '../../../../../../_common/icons/index.js';
import {
  popGroupSetting,
  popSelectGroupByProperty,
} from '../../../../common/group-by/setting.js';
import {
  FilterIcon,
  GroupingIcon,
  InfoIcon,
} from '../../../../common/icons/index.js';
import { popPropertiesSetting } from '../../../../common/properties.js';
import { popFilterModal } from '../../../filter/filter-modal.js';
import { WidgetBase } from '../../../widget-base.js';

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
export class DataViewHeaderToolsViewOptions extends WidgetBase {
  static override styles = styles;

  clickMoreAction = (e: MouseEvent) => {
    e.stopPropagation();
    this.openMoreAction(e.target as HTMLElement);
  };

  openMoreAction = (target: HTMLElement) => {
    this.showToolBar(true);
    popViewOptions(target, this.view, () => {
      this.showToolBar(false);
    });
  };

  override render() {
    if (this.view.readonly) {
      return;
    }
    return html` <div
      class="affine-database-toolbar-item more-action dv-icon-20"
      @click="${this.clickMoreAction}"
    >
      ${MoreHorizontalIcon}
    </div>`;
  }

  showToolBar(show: boolean) {
    const tools = this.closest('data-view-header-tools');
    if (tools) {
      tools.showToolBar = show;
    }
  }

  override accessor view!: DataViewKanbanManager | DataViewTableManager;
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-view-options': DataViewHeaderToolsViewOptions;
  }
}
export const popViewOptions = (
  target: HTMLElement,
  view: DataViewKanbanManager | DataViewTableManager,
  onClose?: () => void
) => {
  const reopen = () => {
    popViewOptions(target, view);
  };
  popMenu(target, {
    options: {
      input: {
        initValue: view.name,
        onComplete: text => {
          view.updateName(text);
        },
      },
      items: [
        {
          icon: InfoIcon,
          name: 'Properties',
          postfix: ArrowRightSmallIcon,
          select: () => {
            requestAnimationFrame(() => {
              popPropertiesSetting(target, {
                onBack: reopen,
                view: view,
              });
            });
          },
          type: 'action',
        },
        {
          icon: FilterIcon,
          name: 'Filter',
          postfix: ArrowRightSmallIcon,
          select: () => {
            popFilterModal(target, {
              isRoot: true,
              onBack: reopen,
              onChange: view.updateFilter.bind(view),
              onDelete: () => {
                view.updateFilter({
                  ...view.filter,
                  conditions: [],
                });
              },
              value: view.filter,
              vars: view.vars,
            });
          },
          type: 'action',
        },
        {
          icon: GroupingIcon,
          name: 'Group',
          postfix: ArrowRightSmallIcon,
          select: () => {
            const groupBy = view.view.groupBy;
            if (!groupBy) {
              popSelectGroupByProperty(target, view);
            } else {
              popGroupSetting(target, view, reopen);
            }
          },
          type: 'action',
        },
        {
          icon: DuplicateIcon,
          name: 'Duplicate',
          select: () => {
            view.duplicateView();
          },
          type: 'action',
        },
        {
          children: () => [
            {
              class: 'delete-item',
              icon: DeleteIcon,
              name: 'Delete View',
              select: () => {
                view.deleteView();
              },
              type: 'action',
            },
          ],
          name: '',
          type: 'group',
        },
      ],
      onClose: onClose,
      style: 'min-width:300px',
    },
  });
};
