import {
  popMenu,
  type PopupTarget,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import {
  ArrowRightSmallIcon,
  DeleteIcon,
  DuplicateIcon,
  FilterIcon,
  GroupingIcon,
  InfoIcon,
  LayoutIcon,
  MoreHorizontalIcon,
} from '@blocksuite/icons/lit';
import { css, html } from 'lit';

import type { SingleView } from '../../../../core/view-manager/single-view.js';

import { emptyFilterGroup } from '../../../../core/common/ast.js';
import {
  popGroupSetting,
  popSelectGroupByProperty,
} from '../../../../core/common/group-by/setting.js';
import { popPropertiesSetting } from '../../../../core/common/properties.js';
import { renderUniLit } from '../../../../core/index.js';
import { WidgetBase } from '../../../../core/widget/widget-base.js';
import {
  KanbanSingleView,
  type KanbanViewData,
  TableSingleView,
  type TableViewData,
} from '../../../../view-presets/index.js';
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
    this.openMoreAction(popupTargetFromElement(e.currentTarget as HTMLElement));
  };

  openMoreAction = (target: PopupTarget) => {
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
  target: PopupTarget,
  view: SingleView<TableViewData | KanbanViewData>,
  onClose?: () => void
) => {
  const reopen = () => {
    popViewOptions(target, view);
  };
  popMenu(target, {
    options: {
      items: [
        {
          type: 'input',
          initialValue: view.name$.value,
          onComplete: text => {
            view.nameSet(text);
          },
        },
        {
          type: 'sub-menu',
          name: 'Layout',
          options: {
            items: view.manager.viewMetas.map(meta => {
              return {
                type: 'action',
                name: meta.model.defaultName,
                prefix: renderUniLit(meta.renderer.icon),
                isSelected: meta.type === view.manager.currentView$.value.type,
                select: () => {
                  view.manager.viewChangeType(
                    view.manager.currentViewId$.value,
                    meta.type
                  );
                },
              };
            }),
          },
          prefix: LayoutIcon(),
          postfix: html` <div
            style="font-size: 14px;text-transform: capitalize;"
          >
            ${view.type}
          </div>`,
        },
        {
          type: 'group',
          items: [
            {
              type: 'action',
              name: 'Properties',
              prefix: InfoIcon(),
              postfix: html` <div style="font-size: 14px;">
                  ${view.properties$.value.length} shown
                </div>
                ${ArrowRightSmallIcon()}`,
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
              prefix: FilterIcon(),
              postfix: html` <div style="font-size: 14px;">
                  ${view.filter$.value.conditions.length
                    ? `${view.filter$.value.conditions.length} filters`
                    : ''}
                </div>
                ${ArrowRightSmallIcon()}`,
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
              prefix: GroupingIcon(),
              postfix: html` <div style="font-size: 14px;">
                  ${view instanceof TableSingleView ||
                  view instanceof KanbanSingleView
                    ? view.groupManager.property$.value?.name$.value
                    : ''}
                </div>
                ${ArrowRightSmallIcon()}`,
              select: () => {
                const groupBy = view.data$.value?.groupBy;
                if (!groupBy) {
                  popSelectGroupByProperty(target, view, () =>
                    popGroupSetting(target, view, reopen)
                  );
                } else {
                  popGroupSetting(target, view, reopen);
                }
              },
            },
          ],
        },
        {
          type: 'group',
          items: [
            {
              type: 'action',
              name: 'Duplicate',
              prefix: DuplicateIcon(),
              select: () => {
                view.duplicate();
              },
            },
            {
              type: 'action',
              name: 'Delete',
              prefix: DeleteIcon(),
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
