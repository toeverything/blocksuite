import {
  ArrowRightSmallIcon,
  DeleteIcon,
  DuplicateIcon,
  MoreHorizontalIcon,
} from '@blocksuite/affine-components/icons';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import type { SingleView } from '../../../../view-manager/single-view.js';

import { popMenu } from '../../../../../../_common/components/index.js';
import { emptyFilterGroup } from '../../../../common/ast.js';
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
    if (this.view.readonly$.value) {
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

  override accessor view!: SingleView;
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-view-options': DataViewHeaderToolsViewOptions;
  }
}
export const popViewOptions = (
  target: HTMLElement,
  view: SingleView,
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
          view.updateName(text);
        },
      },
      items: [
        {
          type: 'action',
          name: 'Properties',
          icon: InfoIcon,
          postfix: ArrowRightSmallIcon,
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
          icon: FilterIcon,
          postfix: ArrowRightSmallIcon,
          select: () => {
            popFilterModal(target, {
              vars: view.vars$.value,
              value: view.filter$.value ?? emptyFilterGroup,
              onChange: view.updateFilter.bind(view),
              isRoot: true,
              onBack: reopen,
              onDelete: () => {
                view.updateFilter({
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
          icon: GroupingIcon,
          postfix: ArrowRightSmallIcon,
          select: () => {
            const groupBy = view.viewData$.value?.groupBy;
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
          icon: DuplicateIcon,
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
              icon: DeleteIcon,
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
