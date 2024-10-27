import {
  menu,
  popMenu,
  type PopupTarget,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import {
  ArrowDownSmallIcon,
  CloseIcon,
  DeleteIcon,
  PlusIcon,
} from '@blocksuite/icons/lit';
import { computed, type ReadonlySignal } from '@preact/signals-core';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { repeat } from 'lit/directives/repeat.js';

import type { Variable } from '../../../core/expression/types.js';
import type { SortBy } from '../../../core/sort/types.js';
import type { SortableView } from '../../../core/sort/utils.js';

import { renderUniLit } from '../../../core/index.js';
import { popCreateSort } from '../../../core/sort/add-sort.js';
import { dragHandler } from '../../../core/utils/wc-dnd/dnd-context.js';
import {
  createSortContext,
  sortable,
} from '../../../core/utils/wc-dnd/sort/sort-context.js';
import { verticalListSortingStrategy } from '../../../core/utils/wc-dnd/sort/strategies/index.js';
import { arrayMove } from '../../../core/utils/wc-dnd/utils/array-move.js';

export class SortRootView extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    .sort-root-container {
      margin-bottom: 8px;
      gap: 8px;
      display: flex;
      flex-direction: column;
    }

    .sort-item {
      display: flex;
      align-items: center;
      transition: transform 0.2s;
    }
  `;

  items$ = computed(() => {
    return this.sortList.value.map(v => v.ref.name);
  });

  sortContext = createSortContext({
    dnd: {
      container: this,
      onDragEnd: evt => {
        const over = evt.over;
        if (over) {
          this.onChange(
            arrayMove(
              this.sortList.value,
              this.sortList.value.findIndex(v => v.ref.name === evt.active.id),
              this.sortList.value.findIndex(v => v.ref.name === over.id)
            )
          );
        }
      },
      modifiers: [
        ({ transform }) => {
          return {
            ...transform,
            x: 0,
          };
        },
      ],
    },
    items: this.items$,
    strategy: verticalListSortingStrategy,
  });

  override render() {
    const list = this.sortList.value;
    return html`
      <div class="sort-root-container">
        ${repeat(list, (sort, index) => {
          const id = sort.ref.name;
          const variable = this.vars.value.find(v => v.id === id);
          let content;
          const deleteRule = () => {
            const newList = list.slice();
            newList.splice(index, 1);
            this.onChange(newList);
          };
          const changeRule = (rule: SortBy) => {
            const newList = list.slice();
            newList.splice(index, 1, rule);
            this.onChange(newList);
          };
          if (!variable) {
            content = html`
              <data-view-component-button
                style="color: var(--affine-error-color);border-color: color: var(--affine-error-color)"
                @click="${deleteRule}"
                .text="${html`This rule is invalid, click to delete`}"
              ></data-view-component-button>
            `;
          } else {
            const descName = sort.desc ? 'Descending' : 'Ascending';
            const clickField = (event: MouseEvent) => {
              popMenu(
                popupTargetFromElement(event.currentTarget as HTMLElement),
                {
                  options: {
                    items: this.vars.value.map(v => {
                      return menu.action({
                        name: v.name,
                        prefix: renderUniLit(v.icon),
                        isSelected: v.id === id,
                        select: () => {
                          changeRule({
                            ...sort,
                            ref: { type: 'ref', name: v.id },
                          });
                        },
                      });
                    }),
                  },
                }
              );
            };
            const clickOrder = (event: MouseEvent) => {
              popMenu(
                popupTargetFromElement(event.currentTarget as HTMLElement),
                {
                  options: {
                    items: [false, true].map(desc => {
                      return menu.action({
                        name: desc ? 'Descending' : 'Ascending',
                        isSelected: desc === sort.desc,
                        select: () => {
                          changeRule({ ...sort, desc });
                        },
                      });
                    }),
                  },
                }
              );
            };
            content = html`
              <data-view-component-button
                style="margin-right: 6px;margin-left: 4px"
                @click="${clickField}"
                .icon="${renderUniLit(variable.icon)}"
                .text="${variable.name}"
                .postfix="${ArrowDownSmallIcon()}"
              ></data-view-component-button>
              <data-view-component-button
                @click="${clickOrder}"
                .text="${html` <div style="padding: 0 4px">${descName}</div>`}"
                .postfix="${ArrowDownSmallIcon()}"
              ></data-view-component-button>
            `;
          }
          return keyed(
            id,
            html`
              <div
                ${sortable(id)}
                class='sort-item'
                >
                <div style='display: flex;align-items: center;flex:1;margin-right: 16px;'>
                  <div
                    ${dragHandler(id)}
                    style='border-radius:2px;cursor:pointer;width: 4px;height: 12px;background-color: ${unsafeCSSVarV2(
                      'button/grabber/default'
                    )}'
                  ></div>
                  ${content}
                </div>
                <div
                  @click='${deleteRule}'
                  style='padding: 2px;display: flex;align-items: center;border-radius: 2px;color:${unsafeCSSVarV2('icon/primary')}'
                  class='dv-hover dv-rounded'>${CloseIcon({ width: '16px', height: '16px' })}
                </div>
              </div>
              </div>
            `
          );
        })}
      </div>
    `;
  }

  @property({ attribute: false })
  accessor onChange!: (filter: SortBy[]) => void;

  @property({ attribute: false })
  accessor sortList!: ReadonlySignal<SortBy[]>;

  @property({ attribute: false })
  accessor vars!: ReadonlySignal<Variable[]>;
}

declare global {
  interface HTMLElementTagNameMap {
    'sort-root-view': SortRootView;
  }
}

export const popSortRoot = (
  target: PopupTarget,
  props: {
    view: SortableView;
    title?: {
      text: string;
      onBack?: () => void;
    };
  }
) => {
  const sortManager = props.view.sortManager;
  const onChange = (list: SortBy[]) => {
    if (list.length > 0) {
      sortManager.setSortList(list);
    } else {
      sortManager.setSortList([]);
      handle.close();
    }
  };
  const handle = popMenu(target, {
    options: {
      title: props.title,
      items: [
        () => {
          const view = props.view;
          const manager = view.sortManager;
          return html` <sort-root-view
            .vars="${view.vars$}"
            .sortList="${manager.sortList$}"
            .onChange="${onChange}"
          ></sort-root-view>`;
        },
        menu.action({
          name: 'Add sort',
          prefix: PlusIcon(),
          select: ele => {
            popCreateSort(popupTargetFromElement(ele), {
              sortList: sortManager.sortList$.value,
              vars: props.view.vars$,
              onSelect: sort => {
                sortManager.setSortList([...sortManager.sortList$.value, sort]);
              },
            });
            return false;
          },
        }),
        menu.action({
          name: 'Delete',
          class: 'delete-item',
          prefix: DeleteIcon(),
          select: () => {
            sortManager.setSortList([]);
          },
        }),
      ],
    },
  });
};
