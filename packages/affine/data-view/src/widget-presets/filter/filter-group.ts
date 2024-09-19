import type { TemplateResult } from 'lit';

import { popFilterableSimpleMenu } from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/global/utils';
import {
  ArrowDownSmallIcon,
  ConvertIcon,
  DeleteIcon,
  DuplicateIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from '@blocksuite/icons/lit';
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

export class FilterGroupView extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    filter-group-view {
      border-radius: 4px;
      padding: 8px 4px 4px;
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
      this.setData({
        ...this.data,
        conditions: [...this.data.conditions, firstFilter(this.vars)],
      });
      return;
    }
    popAddNewFilter(e.target as HTMLElement, {
      value: this.data,
      onChange: this.setData,
      vars: this.vars,
    });
  };

  private _selectOp = (event: MouseEvent) => {
    popFilterableSimpleMenu(event.target as HTMLElement, [
      {
        type: 'action',
        name: 'And',
        select: () => {
          this.setData({
            ...this.data,
            op: 'and',
          });
        },
      },
      {
        type: 'action',
        name: 'Or',
        select: () => {
          this.setData({
            ...this.data,
            op: 'or',
          });
        },
      },
    ]);
  };

  private _setFilter = (index: number, filter: Filter) => {
    this.setData({
      ...this.data,
      conditions: this.data.conditions.map((v, i) =>
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
    const filter = this.data.conditions[i];
    popFilterableSimpleMenu(target, [
      {
        type: 'action',
        name: filter.type === 'filter' ? 'Turn into group' : 'Wrap in group',
        icon: ConvertIcon(),
        onHover: hover => {
          this.containerClass = hover
            ? { index: i, class: 'hover-style' }
            : undefined;
        },
        hide: () => this.depth + getDepth(filter) > 3,
        select: () => {
          this.setData({ type: 'group', op: 'and', conditions: [this.data] });
        },
      },
      {
        type: 'action',
        name: 'Duplicate',
        icon: DuplicateIcon(),
        onHover: hover => {
          this.containerClass = hover
            ? { index: i, class: 'hover-style' }
            : undefined;
        },
        select: () => {
          const conditions = [...this.data.conditions];
          conditions.splice(
            i + 1,
            0,
            JSON.parse(JSON.stringify(conditions[i]))
          );
          this.setData({ ...this.data, conditions: conditions });
        },
      },
      {
        type: 'group',
        name: '',
        children: () => [
          {
            type: 'action',
            name: 'Delete',
            icon: DeleteIcon(),
            class: 'delete-item',
            onHover: hover => {
              this.containerClass = hover
                ? { index: i, class: 'delete-style' }
                : undefined;
            },
            select: () => {
              const conditions = [...this.data.conditions];
              conditions.splice(i, 1);
              this.setData({
                ...this.data,
                conditions,
              });
            },
          },
        ],
      },
    ]);
  }

  override render() {
    const data = this.data;
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
                      .vars="${this.vars}"
                      .data="${filter}"
                    ></filter-condition-view>
                  `
                : html`
                    <filter-group-view
                      class="${groupClassList}"
                      style="width: 100%;"
                      .depth="${this.depth + 1}"
                      .setData="${(v: Filter) => this._setFilter(i, v)}"
                      .vars="${this.vars}"
                      .data="${filter}"
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
  accessor data!: FilterGroup;

  @property({ attribute: false })
  accessor depth = 1;

  @property({ attribute: false })
  accessor setData!: (filter: FilterGroup) => void;

  @property({ attribute: false })
  accessor vars!: Variable[];
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
