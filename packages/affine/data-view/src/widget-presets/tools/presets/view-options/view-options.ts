import { popMenu } from '@blocksuite/affine-components/context-menu';
import {
  ArrowRightSmallIcon,
  DeleteIcon,
  DuplicateIcon,
  FilterIcon,
  GroupingIcon,
  InfoIcon,
  MoreHorizontalIcon,
} from '@blocksuite/icons/lit';
import { css, html } from 'lit';

import type { SingleView } from '../../../../core/view-manager/single-view.js';
import type {
  KanbanViewData,
  TableViewData,
} from '../../../../view-presets/index.js';

import { emptyFilterGroup } from '../../../../core/common/ast.js';
import {
  popGroupSetting,
  popSelectGroupByProperty,
} from '../../../../core/common/group-by/setting.js';
import { popPropertiesSetting } from '../../../../core/common/properties.js';
import { renderUniLit } from '../../../../core/index.js';
import { WidgetBase } from '../../../../core/widget/widget-base.js';
import { popFilterModal } from '../../../filter/filter-modal.js';

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
    if (this.view.readonly$.value) {
      return;
    }
    return html` <div
      class="affine-database-toolbar-item more-action dv-icon-20"
      @click="${this.clickMoreAction}"
    >
      ${MoreHorizontalIcon()}
    </div>`;
  }

  showToolBar(show: boolean) {
    const tools = this.closest('data-view-header-tools');
    if (tools) {
      tools.showToolBar = show;
    }
  }

  override accessor view!: SingleView<TableViewData | KanbanViewData>;
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-view-options': DataViewHeaderToolsViewOptions;
  }
}
export const popViewOptions = (
  target: HTMLElement,
  view: SingleView<TableViewData | KanbanViewData>,
  onClose?: () => void
) => {
  const reopen = () => {
    popViewOptions(target, view);
  };
  popMenu(target, {
    options: {
      style: 'min-width:300px',
      input: {
        initValue: view.name$.value,
        onComplete: text => {
          view.nameSet(text);
        },
      },
      items: [
        {
          type: 'group',
          name: 'Layout',
          children: () => [
            {
              type: 'sub-menu',
              name: 'Layout',
              options: {
                input: {
                  search: true,
                },
                items: view.manager.viewMetas.map(meta => {
                  return {
                    type: 'action',
                    name: meta.model.defaultName,
                    icon: renderUniLit(meta.renderer.icon),
                    isSelected:
                      meta.type === view.manager.currentView$.value.type,
                    select: () => {
                      console.log(meta.type);
                      view.manager.viewChangeType(
                        view.manager.currentViewId$.value,
                        meta.type
                      );
                    },
                  };
                }),
              },
              icon: InfoIcon(),
            },
          ],
        },
        {
          type: 'action',
          name: 'Properties',
          icon: InfoIcon(),
          postfix: ArrowRightSmallIcon(),
          select: () => {
            requestAnimationFrame(() => {
              popPropertiesSetting(target, {
                view: view,
                onBack: reopen,
              });
            });
          },
        },
        {
          type: 'action',
          name: 'Filter',
          icon: FilterIcon(),
          postfix: ArrowRightSmallIcon(),
          select: () => {
            popFilterModal(target, {
              vars: view.vars$.value,
              value: view.filter$.value ?? emptyFilterGroup,
              onChange: view.filterSet.bind(view),
              isRoot: true,
              onBack: reopen,
              onDelete: () => {
                view.filterSet({
                  ...(view.filter$.value ?? emptyFilterGroup),
                  conditions: [],
                });
              },
            });
          },
        },
        {
          type: 'action',
          name: 'Group',
          icon: GroupingIcon(),
          postfix: ArrowRightSmallIcon(),
          select: () => {
            const groupBy = view.data$.value?.groupBy;
            if (!groupBy) {
              popSelectGroupByProperty(target, view);
            } else {
              popGroupSetting(target, view, reopen);
            }
          },
        },
        {
          type: 'action',
          name: 'Duplicate',
          icon: DuplicateIcon(),
          select: () => {
            view.duplicate();
          },
        },
        {
          type: 'group',
          name: '',
          children: () => [
            {
              type: 'action',
              name: 'Delete View',
              icon: DeleteIcon(),
              select: () => {
                view.delete();
              },
              class: 'delete-item',
            },
          ],
        },
      ],
      onClose: onClose,
    },
  });
};
