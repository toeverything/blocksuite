import './condition.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { ReferenceElement } from '@floating-ui/dom';
import type { TemplateResult } from 'lit';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  eventToVRect,
  popFilterableSimpleMenu,
} from '../../../components/menu/menu.js';
import {
  ArrowDownSmallIcon,
  ConvertIcon,
  DeleteIcon,
  DuplicateIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from '../../../icons/index.js';
import type { Filter, FilterGroup, Variable } from '../ast.js';
import { firstFilter } from '../ast.js';
import { popAddNewFilter } from './condition.js';

@customElement('filter-group-view')
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
      font-size: 15px;
      line-height: 24px;
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
  `;
  @property({ attribute: false })
  depth = 1;
  @property({ attribute: false })
  data!: FilterGroup;

  @property({ attribute: false })
  vars!: Variable[];

  @property({ attribute: false })
  setData!: (filter: FilterGroup) => void;

  private opMap = {
    and: 'And',
    or: 'Or',
  };

  private _setFilter = (index: number, filter: Filter) => {
    this.setData({
      ...this.data,
      conditions: this.data.conditions.map((v, i) =>
        index === i ? filter : v
      ),
    });
  };

  private _addNew = (e: MouseEvent) => {
    if (this.isMaxDepth) {
      this.setData({
        ...this.data,
        conditions: [...this.data.conditions, firstFilter(this.vars)],
      });
      return;
    }
    popAddNewFilter(eventToVRect(e), {
      value: this.data,
      onChange: this.setData,
      vars: this.vars,
    });
  };
  private _selectOp = (event: MouseEvent) => {
    popFilterableSimpleMenu(eventToVRect(event), [
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

  @state()
  deleteIndex?: number;

  private _clickConditionOps(target: ReferenceElement, i: number) {
    popFilterableSimpleMenu(target, [
      {
        type: 'action',
        name: 'Wrap with group',
        icon: ConvertIcon,
        select: () => {
          //
        },
      },
      {
        type: 'action',
        name: 'Duplicate',
        icon: DuplicateIcon,
        select: () => {
          //
        },
      },
      {
        type: 'group',
        name: '',
        children: () => [
          {
            type: 'action',
            name: 'Delete',
            icon: DeleteIcon,
            class: 'delete-item',
            onHover: hover => {
              this.deleteIndex = hover ? i : undefined;
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
  private get isMaxDepth() {
    return this.depth === 3;
  }
  override render() {
    const data = this.data;
    return html`
      <div class="filter-group-container">
        ${repeat(data.conditions, (filter, i) => {
          const clickOps = (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            this._clickConditionOps(eventToVRect(e), i);
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
            'hover-pd-round': true,
            'delete-style': this.deleteIndex === i,
          });
          const groupClassList = classMap({
            [`filter-group-bg-${this.depth}`]: filter.type !== 'filter',
          });
          return html` <div class="${classList}" @contextmenu=${clickOps}>
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
                      class=${groupClassList}
                      style="width: 100%;"
                      .depth=${this.depth + 1}
                      .setData="${(v: Filter) => this._setFilter(i, v)}"
                      .vars="${this.vars}"
                      .data="${filter}"
                    ></filter-group-view>
                  `}
              <div class="filter-group-item-ops" @click="${clickOps}">
                ${MoreHorizontalIcon}
              </div>
            </div>
          </div>`;
        })}
      </div>
      <div class="filter-group-button add-new" @click="${this._addNew}">
        ${PlusIcon} Add ${this.isMaxDepth ? nothing : ArrowDownSmallIcon}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-group-view': FilterGroupView;
  }
}
