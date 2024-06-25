import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import type { PropertyValues } from 'lit';
import { css, html, unsafeCSS } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import Sortable from 'sortablejs';

import {
  type Menu,
  type MenuOptions,
  popMenu,
} from '../../../../_common/components/index.js';
import { ArrowRightSmallIcon } from '../../../../_common/icons/index.js';
import { menuTitleItem } from '../../utils/menu-title.js';
import { renderUniLit } from '../../utils/uni-component/uni-component.js';
import { DataViewKanbanManager } from '../../view/presets/kanban/kanban-view-manager.js';
import { DataViewTableManager } from '../../view/presets/table/table-view-manager.js';
import { dataViewCssVariable } from '../css-variable.js';
import { DeleteIcon } from '../icons/index.js';
import type { GroupRenderProps } from './matcher.js';
import { groupByMatcher } from './matcher.js';

@customElement('data-view-group-setting')
export class GroupSetting extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    data-view-group-setting {
      display: flex;
      flex-direction: column;
      gap: 4px;
      ${unsafeCSS(dataViewCssVariable())};
    }
    .group-item {
      display: flex;
      padding: 4px 12px;
      position: relative;
      cursor: grab;
    }

    .group-item-drag-bar {
      width: 4px;
      height: 12px;
      border-radius: 1px;
      background-color: #efeff0;
      position: absolute;
      left: 4px;
      top: 0;
      bottom: 0;
      margin: auto;
    }

    .group-item:hover .group-item-drag-bar {
      background-color: #c0bfc1;
    }
  `;

  @property({ attribute: false })
  accessor view!: DataViewTableManager | DataViewKanbanManager;

  @query('.group-sort-setting')
  accessor groupContainer!: HTMLElement;

  protected override firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    const sortable = new Sortable(this.groupContainer, {
      animation: 150,
      group: `group-sort-${this.view.id}`,
      onEnd: evt => {
        const groupHelper = this.view.groupHelper;
        if (!groupHelper) {
          return;
        }
        const groups = [...groupHelper.groups];
        const index = evt.oldIndex ?? -1;
        const from = groups[index];
        groups.splice(index, 1);
        const to = groups[evt.newIndex ?? -1];
        groupHelper.moveGroupTo(
          from.key,
          to
            ? {
                before: true,
                id: to.key,
              }
            : 'end'
        );
      },
    });
    this._disposables.add({
      dispose: () => sortable.destroy(),
    });
  }

  protected override render(): unknown {
    const helper = this.view.groupHelper;
    if (!helper) {
      return;
    }
    return html`
      <div style="padding: 7px 12px;">
        <div
          style="padding: 0 4px; font-size: 12px;color: var(--affine-text-secondary-color);line-height: 20px;"
        >
          Groups
        </div>
        <div></div>
      </div>
      <div
        style="display:flex;flex-direction: column;gap: 4px;"
        class="group-sort-setting"
      >
        ${repeat(
          helper.groups,
          group => group.key,
          group => {
            const props: GroupRenderProps = {
              value: group.value,
              data: group.helper.data,
              readonly: true,
            };
            const config = group.helper.groupConfig();
            return html` <div class="dv-hover dv-round-4 group-item">
              <div class="group-item-drag-bar"></div>
              <div style="padding: 0 4px;position:relative;">
                ${renderUniLit(config?.view, props)}
                <div
                  style="position:absolute;left: 0;top: 0;right: 0;bottom: 0;"
                ></div>
              </div>
            </div>`;
          }
        )}
      </div>
    `;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.view.slots.update.on(() => {
        this.requestUpdate();
      })
    );
    this._disposables.addFromEvent(this, 'pointerdown', e => {
      e.stopPropagation();
    });
  }
}
export const selectGroupByProperty = (
  view: DataViewTableManager | DataViewKanbanManager,
  onClose?: () => void
): MenuOptions => {
  return {
    onClose,
    input: {
      search: true,
      placeholder: 'Search',
    },
    items: [
      ...view.columnsWithoutFilter
        .filter(id => {
          if (view.columnGet(id).type === 'title') {
            return false;
          }
          return !!groupByMatcher.match(view.columnGet(id).dataType);
        })
        .map<Menu>(id => {
          const column = view.columnGet(id);
          return {
            type: 'action',
            name: column.name,
            isSelected: view.view.groupBy?.columnId === id,
            icon: html` <uni-lit .uni="${column.icon}"></uni-lit>`,
            select: () => {
              view.changeGroup(id);
            },
          };
        }),
      {
        type: 'group',
        name: '',
        hide: () =>
          view instanceof DataViewKanbanManager || view.view.groupBy == null,
        children: () => [
          {
            type: 'action',
            icon: DeleteIcon,
            class: 'delete-item',
            name: 'Remove Grouping',
            select: () => {
              if (view instanceof DataViewTableManager) {
                view.changeGroup(undefined);
              }
            },
          },
        ],
      },
    ],
  };
};
export const popSelectGroupByProperty = (
  target: HTMLElement,
  view: DataViewTableManager | DataViewKanbanManager,
  onClose?: () => void
) => {
  popMenu(target, {
    options: selectGroupByProperty(view, onClose),
  });
};
export const popGroupSetting = (
  target: HTMLElement,
  view: DataViewTableManager | DataViewKanbanManager,
  onBack: () => void
) => {
  const groupBy = view.view.groupBy;
  if (groupBy == null) {
    return;
  }
  const reopen = () => {
    popGroupSetting(target, view, onBack);
  };
  const type = view.columnGetType(groupBy.columnId);
  const icon = view.getIcon(type);
  const menuHandler = popMenu(target, {
    options: {
      input: {
        search: true,
      },
      items: [
        menuTitleItem('GROUP', () => {
          onBack();
          menuHandler.close();
        }),
        {
          type: 'group',
          name: '',
          children: () => [
            {
              type: 'sub-menu',
              name: 'Group By',
              postfix: html`
                <div
                  style="display:flex;align-items:center;gap: 4px;font-size: 12px;line-height: 20px;color: var(--affine-text-secondary-color);margin-right: 4px;margin-left: 8px;"
                  class="dv-icon-16"
                >
                  ${renderUniLit(icon, {})}
                  ${view.columnGetName(groupBy.columnId)}
                </div>
                ${ArrowRightSmallIcon}
              `,
              options: selectGroupByProperty(view, reopen),
            },
          ],
        },
        {
          type: 'group',
          name: '',
          children: () => [
            {
              type: 'custom',
              render: html` <data-view-group-setting
                .view="${view}"
                .columnId="${groupBy.columnId}"
              ></data-view-group-setting>`,
            },
          ],
        },
      ],
    },
  });
};
