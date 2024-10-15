import type { TemplateResult } from 'lit';

import {
  menu,
  popFilterableSimpleMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher } from '@blocksuite/global/utils';
import {
  ArrowDownSmallIcon,
  ConvertIcon,
  DeleteIcon,
  DuplicateIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from '@blocksuite/icons/lit';
import { computed, type ReadonlySignal } from '@preact/signals-core';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  type Filter,
  type FilterGroup,
  firstFilter,
  type Variable,
} from '../../core/common/ast.js';
import { popAddNewFilter } from './condition.js';

export class FilterGroupView extends SignalWatcher(ShadowlessElement) {
  static override styles = css`
    filter-group-view {
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      user-select: none;
    }

    .filter-group-op {
      width: 60px;
      display: flex;
      justify-content: end;
      padding: 4px;
      height: 34px;
      align-items: center;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 22px;
      color: var(--affine-text-primary-color);
    }

    .filter-group-op-clickable {
      border-radius: 4px;
      cursor: pointer;
    }

    .filter-group-op-clickable:hover {
      background-color: var(--affine-hover-color);
    }

    .filter-group-container {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .filter-group-button {
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      line-height: 22px;
      border-radius: 4px;
      cursor: pointer;
      color: var(--affine-text-secondary-color);
    }

    .filter-group-button svg {
      fill: var(--affine-text-secondary-color);
      color: var(--affine-text-secondary-color);
      width: 20px;
      height: 20px;
    }

    .filter-group-button:hover {
      background-color: var(--affine-hover-color);
      color: var(--affine-text-primary-color);
    }

    .filter-group-button:hover svg {
      fill: var(--affine-text-primary-color);
      color: var(--affine-text-primary-color);
    }

    .filter-group-item {
      padding: 4px 0;
      display: flex;
      align-items: start;
      gap: 8px;
    }

    .filter-group-item-ops {
      margin-top: 4px;
      padding: 4px;
      border-radius: 4px;
      height: max-content;
      display: flex;
      cursor: pointer;
    }

    .filter-group-item-ops:hover {
      background-color: var(--affine-hover-color);
    }

    .filter-group-item-ops svg {
      fill: var(--affine-text-secondary-color);
      color: var(--affine-text-secondary-color);
      width: 18px;
      height: 18px;
    }

    .filter-group-item-ops:hover svg {
      fill: var(--affine-text-primary-color);
      color: var(--affine-text-primary-color);
    }

    .delete-style {
      background-color: var(--affine-background-error-color);
    }

    .filter-group-border {
      border: 1px dashed var(--affine-border-color);
    }

    .filter-group-bg-1 {
      background-color: var(--affine-background-secondary-color);
      border: 1px solid var(--affine-border-color);
    }

    .filter-group-bg-2 {
      background-color: var(--affine-background-tertiary-color);
      border: 1px solid var(--affine-border-color);
    }

    .hover-style {
      background-color: var(--affine-hover-color);
    }

    .delete-style {
      background-color: var(--affine-background-error-color);
    }
  `;

  private _addNew = (e: MouseEvent) => {
    if (this.isMaxDepth) {
      this.onChange({
        ...this.filterGroup.value,
        conditions: [
          ...this.filterGroup.value.conditions,
          firstFilter(this.vars.value),
        ],
      });
      return;
    }
    popAddNewFilter(popupTargetFromElement(e.currentTarget as HTMLElement), {
      value: this.filterGroup.value,
      onChange: this.onChange,
      vars: this.vars.value,
    });
  };

  private _selectOp = (event: MouseEvent) => {
    popFilterableSimpleMenu(
      popupTargetFromElement(event.currentTarget as HTMLElement),
      [
        menu.action({
          name: 'And',
          select: () => {
            this.onChange({
              ...this.filterGroup.value,
              op: 'and',
            });
          },
        }),
        menu.action({
          name: 'Or',
          select: () => {
            this.onChange({
              ...this.filterGroup.value,
              op: 'or',
            });
          },
        }),
      ]
    );
  };

  private _setFilter = (index: number, filter: Filter) => {
    this.onChange({
      ...this.filterGroup.value,
      conditions: this.filterGroup.value.conditions.map((v, i) =>
        index === i ? filter : v
      ),
    });
  };

  private opMap = {
    and: 'And',
    or: 'Or',
  };

  private get isMaxDepth() {
    return this.depth === 3;
  }

  private _clickConditionOps(target: HTMLElement, i: number) {
    const filter = this.filterGroup.value.conditions[i];
    popFilterableSimpleMenu(popupTargetFromElement(target), [
      menu.action({
        name: filter.type === 'filter' ? 'Turn into group' : 'Wrap in group',
        prefix: ConvertIcon(),
        onHover: hover => {
          this.containerClass = hover
            ? { index: i, class: 'hover-style' }
            : undefined;
        },
        hide: () => this.depth + getDepth(filter) > 3,
        select: () => {
          this.onChange({
            type: 'group',
            op: 'and',
            conditions: [this.filterGroup.value],
          });
        },
      }),
      menu.action({
        name: 'Duplicate',
        prefix: DuplicateIcon(),
        onHover: hover => {
          this.containerClass = hover
            ? { index: i, class: 'hover-style' }
            : undefined;
        },
        select: () => {
          const conditions = [...this.filterGroup.value.conditions];
          conditions.splice(
            i + 1,
            0,
            JSON.parse(JSON.stringify(conditions[i]))
          );
          this.onChange({ ...this.filterGroup.value, conditions: conditions });
        },
      }),
      menu.group({
        name: '',
        items: [
          menu.action({
            name: 'Delete',
            prefix: DeleteIcon(),
            class: 'delete-item',
            onHover: hover => {
              this.containerClass = hover
                ? { index: i, class: 'delete-style' }
                : undefined;
            },
            select: () => {
              const conditions = [...this.filterGroup.value.conditions];
              conditions.splice(i, 1);
              this.onChange({
                ...this.filterGroup.value,
                conditions,
              });
            },
          }),
        ],
      }),
    ]);
  }

  override render() {
    const data = this.filterGroup.value;
    return html`
      <div class="filter-group-container">
        ${repeat(data.conditions, (filter, i) => {
          const clickOps = (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            this._clickConditionOps(e.target as HTMLElement, i);
          };
          let op: TemplateResult;
          if (i === 0) {
            op = html` <div class="filter-group-op">Where</div>`;
          } else {
            op = html`
              <div
                class="filter-group-op filter-group-op-clickable"
                @click="${this._selectOp}"
              >
                ${this.opMap[data.op]}
              </div>
            `;
          }
          const classList = classMap({
            'filter-root-item': true,
            'filter-exactly-hover-container': true,
            'dv-pd-4 dv-round-4': true,
            [this.containerClass?.class ?? '']:
              this.containerClass?.index === i,
          });
          const groupClassList = classMap({
            [`filter-group-bg-${this.depth}`]: filter.type !== 'filter',
          });
          return html` <div class="${classList}" @contextmenu="${clickOps}">
            ${op}
            <div
              style="flex:1;display:flex;align-items:start;justify-content: space-between;gap: 8px;"
            >
              ${filter.type === 'filter'
                ? html`
                    <filter-condition-view
                      .setData="${(v: Filter) => this._setFilter(i, v)}"
                      .vars="${this.vars.value}"
                      .data="${filter}"
                    ></filter-condition-view>
                  `
                : html`
                    <filter-group-view
                      class="${groupClassList}"
                      style="width: 100%;"
                      .depth="${this.depth + 1}"
                      .onChange="${(v: Filter) => this._setFilter(i, v)}"
                      .vars="${this.vars}"
                      .filterGroup="${computed(() => filter)}"
                    ></filter-group-view>
                  `}
              <div class="filter-group-item-ops" @click="${clickOps}">
                ${MoreHorizontalIcon()}
              </div>
            </div>
          </div>`;
        })}
      </div>
      <div class="filter-group-button" @click="${this._addNew}">
        ${PlusIcon()} Add ${this.isMaxDepth ? nothing : ArrowDownSmallIcon()}
      </div>
    `;
  }

  @state()
  accessor containerClass:
    | {
        index: number;
        class: string;
      }
    | undefined = undefined;

  @property({ attribute: false })
  accessor depth = 1;

  @property({ attribute: false })
  accessor filterGroup!: ReadonlySignal<FilterGroup>;

  @property({ attribute: false })
  accessor onChange!: (filter: FilterGroup) => void;

  @property({ attribute: false })
  accessor vars!: ReadonlySignal<Variable[]>;
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-group-view': FilterGroupView;
  }
}
export const getDepth = (filter: Filter): number => {
  if (filter.type === 'filter') {
    return 1;
  }
  return Math.max(...filter.conditions.map(getDepth)) + 1;
};
