import type { PropertyValues } from 'lit';

import {
  menu,
  type MenuConfig,
  type MenuOptions,
  popMenu,
  type PopupTarget,
} from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { DeleteIcon } from '@blocksuite/icons/lit';
import { css, html, unsafeCSS } from 'lit';
import { property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import Sortable from 'sortablejs';

import type {
  KanbanViewData,
  TableViewData,
} from '../../../view-presets/index.js';
import type { SingleView } from '../../view-manager/single-view.js';
import type { GroupRenderProps } from './types.js';

import { KanbanSingleView } from '../../../view-presets/kanban/kanban-view-manager.js';
import { TableSingleView } from '../../../view-presets/table/table-view-manager.js';
import { renderUniLit } from '../../utils/uni-component/uni-component.js';
import { dataViewCssVariable } from '../css-variable.js';
import { groupByMatcher } from './matcher.js';

export class GroupSetting extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
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

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(this, 'pointerdown', e => {
      e.stopPropagation();
    });
  }

  protected override firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    const sortable = new Sortable(this.groupContainer, {
      animation: 150,
      group: `group-sort-${this.view.id}`,
      onEnd: evt => {
        const groupManager = this.view.groupManager;
        const oldGroups = groupManager.groupsDataList$.value;
        if (!oldGroups) {
          return;
        }
        const groups = [...oldGroups];
        const index = evt.oldIndex ?? -1;
        const from = groups[index];
        groups.splice(index, 1);
        const to = groups[evt.newIndex ?? -1];
        groupManager.moveGroupTo(
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
    const groups = this.view.groupManager.groupsDataList$.value;
    if (!groups) {
      return;
    }
    return html`
      <div style="padding: 7px 0;">
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
          groups,
          group => group.key,
          group => {
            const props: GroupRenderProps = {
              value: group.value,
              data: group.property.data$.value,
              readonly: true,
            };
            const config = group.manager.config$.value;
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

  @query('.group-sort-setting')
  accessor groupContainer!: HTMLElement;

  @property({ attribute: false })
  accessor view!: TableSingleView | KanbanSingleView;
}

export const selectGroupByProperty = (
  view: SingleView<TableViewData | KanbanViewData>,
  ops?: {
    onSelect?: (id?: string) => void;
    onClose?: () => void;
    onBack?: () => void;
  }
): MenuOptions => {
  return {
    onClose: ops?.onClose,
    title: {
      text: 'Group by',
      onBack: ops?.onBack,
    },
    items: [
      ...view.propertiesWithoutFilter$.value
        .filter(id => {
          if (view.propertyGet(id).type$.value === 'title') {
            return false;
          }
          return !!groupByMatcher.match(view.propertyGet(id).dataType$.value);
        })
        .map<MenuConfig>(id => {
          const property = view.propertyGet(id);
          return menu.action({
            name: property.name$.value,
            isSelected: view.data$.value?.groupBy?.columnId === id,
            prefix: html` <microsheet-uni-lit
              .uni="${property.icon}"
            ></microsheet-uni-lit>`,
            select: () => {
              if (
                view instanceof TableSingleView ||
                view instanceof KanbanSingleView
              ) {
                view.changeGroup(id);
                ops?.onSelect?.(id);
              }
            },
          });
        }),
      menu.group({
        items: [
          menu.action({
            prefix: DeleteIcon(),
            hide: () =>
              view instanceof KanbanSingleView ||
              view.data$.value?.groupBy == null,
            class: 'delete-item',
            name: 'Remove Grouping',
            select: () => {
              if (view instanceof TableSingleView) {
                view.changeGroup(undefined);
                ops?.onSelect?.();
              }
            },
          }),
        ],
      }),
    ],
  };
};
export const popSelectGroupByProperty = (
  target: PopupTarget,
  view: SingleView<TableViewData | KanbanViewData>,
  ops?: {
    onSelect?: () => void;
    onClose?: () => void;
    onBack?: () => void;
  }
) => {
  popMenu(target, {
    options: selectGroupByProperty(view, ops),
  });
};
export const popGroupSetting = (
  target: PopupTarget,
  view: SingleView<TableViewData | KanbanViewData>,
  onBack: () => void
) => {
  const groupBy = view.data$.value?.groupBy;
  if (groupBy == null) {
    return;
  }
  const type = view.propertyTypeGet(groupBy.columnId);
  if (!type) {
    return;
  }
  const icon = view.IconGet(type);
  const menuHandler = popMenu(target, {
    options: {
      title: {
        text: 'Group',
        onBack: onBack,
      },
      items: [
        menu.group({
          items: [
            menu.subMenu({
              name: 'Group By',
              postfix: html`
                <div
                  style="display:flex;align-items:center;gap: 4px;font-size: 12px;line-height: 20px;color: var(--affine-text-secondary-color);margin-right: 4px;margin-left: 8px;"
                  class="dv-icon-16"
                >
                  ${renderUniLit(icon, {})}
                  ${view.propertyNameGet(groupBy.columnId)}
                </div>
              `,
              label: () => html`
                <div style="color: var(--affine-text-secondary-color);">
                  Group By
                </div>
              `,
              options: selectGroupByProperty(view, {
                onSelect: () => {
                  menuHandler.close();
                  popGroupSetting(target, view, onBack);
                },
              }),
            }),
          ],
        }),
        menu.group({
          items: [
            menu =>
              html` <data-view-group-setting
                @mouseenter="${() => menu.closeSubMenu()}"
                .view="${view}"
                .columnId="${groupBy.columnId}"
              ></data-view-group-setting>`,
          ],
        }),
        menu.group({
          items: [
            menu.action({
              name: 'Remove grouping',
              prefix: DeleteIcon(),
              class: 'delete-item',
              hide: () => !(view instanceof TableSingleView),
              select: () => {
                if (view instanceof TableSingleView) {
                  view.changeGroup(undefined);
                }
              },
            }),
          ],
        }),
      ],
    },
  });
};
