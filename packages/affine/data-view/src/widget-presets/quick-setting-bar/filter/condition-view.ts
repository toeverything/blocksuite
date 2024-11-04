import {
  menu,
  popFilterableSimpleMenu,
  popMenu,
  type PopupTarget,
  popupTargetFromElement,
  subMenuMiddleware,
} from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher } from '@blocksuite/global/utils';
import {
  ArrowDownSmallIcon,
  ArrowRightSmallIcon,
  DeleteIcon,
} from '@blocksuite/icons/lit';
import { computed, type ReadonlySignal } from '@preact/signals-core';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';

import type { Variable } from '../../../core/expression/types.js';
import type { Filter, SingleFilter } from '../../../core/filter/types.js';

import { getRefType } from '../../../core/expression/ref/ref.js';
import { filterMatcher } from '../../../core/filter/filter-fn/matcher.js';
import { literalItemsMatcher } from '../../../core/filter/literal/index.js';
import {
  renderUniLit,
  t,
  type TypeInstance,
  typeSystem,
} from '../../../core/index.js';

export class FilterConditionView extends SignalWatcher(ShadowlessElement) {
  static override styles = css`
    filter-condition-view {
    }

    .filter-condition-expression {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .filter-condition-delete {
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      height: max-content;
      cursor: pointer;
    }

    .filter-condition-delete:hover {
      background-color: var(--affine-hover-color);
    }

    .filter-condition-delete svg {
      width: 16px;
      height: 16px;
    }

    .filter-condition-function-name {
      font-size: 12px;
      line-height: 20px;
      color: var(--affine-text-secondary-color);
      padding: 2px 8px;
      border-radius: 4px;
      cursor: pointer;
    }

    .filter-condition-function-name:hover {
      background-color: var(--affine-hover-color);
    }

    .filter-condition-arg {
      font-size: 12px;
      font-style: normal;
      font-weight: 600;
      padding: 0 4px;
      height: 100%;
      display: flex;
      align-items: center;
    }
  `;

  private onClickButton = (evt: Event) => {
    this.popConditionEdit(
      popupTargetFromElement(evt.currentTarget as HTMLElement)
    );
  };

  private popConditionEdit = (target: PopupTarget) => {
    const type = this.leftVar$.value?.type;
    if (!type) {
      return;
    }
    const fn = this.fnConfig$.value;
    if (!fn) {
      popFilterableSimpleMenu(target, this.getFunctionItems(target));
      return;
    }
    const handler = popMenu(target, {
      options: {
        items: [
          menu.action({
            name: fn.label,
            postfix: ArrowRightSmallIcon(),
            select: ele => {
              popMenu(popupTargetFromElement(ele), {
                options: {
                  items: this.getFunctionItems(target, () => {
                    handler.close();
                  }),
                },
                middleware: subMenuMiddleware,
              });
              return false;
            },
          }),
          menu.dynamic(() => this.getArgsItems()),
          menu.group({
            items: [
              menu.action({
                name: 'Delete',
                class: { 'delete-item': true },
                prefix: DeleteIcon(),
                select: () => {
                  const list = this.value.value.slice();
                  list.splice(this.index, 1);
                  this.onChange(list);
                },
              }),
            ],
          }),
        ],
      },
    });
  };

  @property({ attribute: false })
  accessor value!: ReadonlySignal<Filter[]>;

  filter$ = computed(() => {
    const filter = this.value.value[this.index];
    if (!filter || filter.type !== 'filter') {
      return;
    }
    return filter;
  });

  args$ = computed(() => {
    return this.filter$.value?.args.map(v => v.value);
  });

  fnConfig$ = computed(() => {
    return filterMatcher.getFilterByName(this.filter$.value?.function);
  });

  @property({ attribute: false })
  accessor vars!: ReadonlySignal<Variable[]>;

  fnType$ = computed(() => {
    const fnConfig = this.fnConfig$.value;
    const filter = this.filter$.value;
    if (!fnConfig || !filter) {
      return;
    }
    const refType = getRefType(this.vars.value, filter.left);
    if (!refType) {
      return;
    }
    const fnTemplate = t.fn.instance(
      [fnConfig.self, ...fnConfig.args],
      t.boolean.instance(),
      fnConfig.vars
    );
    return typeSystem.instanceFn(
      fnTemplate,
      [refType],
      t.boolean.instance(),
      {}
    );
  });

  getFunctionItems = (target: PopupTarget, onSelect?: () => void) => {
    const filter = this.filter$.value;
    if (!filter) {
      return [];
    }
    const type = getRefType(this.vars.value, filter?.left);
    if (!type) {
      return [];
    }
    return filterMatcher.filterListBySelfType(type).map(v => {
      const selected = v.name === filter.function;
      return menu.action({
        name: v.label,
        isSelected: selected,
        select: () => {
          this.setFilter({
            ...filter,
            function: v.name,
          });
          onSelect?.();
          this.popConditionEdit(target);
        },
      });
    });
  };

  leftVar$ = computed(() => {
    return this.vars.value.find(v => v.id === this.filter$.value?.left.name);
  });

  setFilter = (filter: SingleFilter) => {
    const list = this.value.value.slice();
    list[this.index] = filter;
    this.onChange(list);
  };

  text$ = computed(() => {
    const name = this.leftVar$.value?.name ?? '';
    const data = this.fnConfig$.value;
    const type = this.fnType$.value;
    const argValues = this.args$.value;
    if (!type || !argValues || !data) {
      return;
    }
    const argDataList = argValues.map((v, i) =>
      v ? { value: v, type: type.args[i] } : undefined
    );
    const valueString = data.shortString?.(...argDataList) ?? '';
    if (valueString) {
      return `${name}${valueString}`;
    }
    return name;
  });

  private getArgItems(argType: TypeInstance, index: number) {
    return literalItemsMatcher.getItems(
      argType,
      computed(() => {
        return this.filter$.value?.args[index]?.value;
      }),
      value => {
        const filter = this.filter$.value;
        if (!filter) {
          return;
        }
        const args = filter.args.slice();
        args[index] = { type: 'literal', value };
        this.setFilter({
          ...filter,
          args: args,
        });
      }
    );
  }

  private getArgsItems() {
    return (
      this.fnType$.value?.args
        .slice(1)
        .flatMap((arg, i) => this.getArgItems(arg, i)) ?? []
    );
  }

  override render() {
    const leftVar = this.leftVar$.value;
    if (!leftVar) {
      return html` <data-view-component-button
        hoverType="border"
        .text="${html`Invalid filter rule`}"
      ></data-view-component-button>`;
    }
    return html`
      <data-view-component-button
        hoverType="border"
        .icon="${renderUniLit(leftVar.icon)}"
        @click="${this.onClickButton}"
        .text="${html`<span
          style="overflow: hidden;max-width: 230px;text-overflow: ellipsis"
          >${this.text$.value}</span
        >`}"
        .postfix="${ArrowDownSmallIcon()}"
      ></data-view-component-button>
    `;
  }

  @property({ attribute: false })
  accessor index!: number;

  @property({ attribute: false })
  accessor onChange!: (filters: Filter[]) => void;
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-condition-view': FilterConditionView;
  }
}
