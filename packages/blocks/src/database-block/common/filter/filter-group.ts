import './condition.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { TemplateResult } from 'lit';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { popFilterableSimpleMenu } from '../../../components/menu/menu.js';
import { MoreHorizontalIcon, PlusIcon } from '../../../icons/index.js';
import type { Filter, FilterGroup, Variable } from '../ast.js';
import { firstFilter, firstFilterInGroup } from '../ast.js';

@customElement('filter-group-view')
export class FilterGroupView extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    filter-group-view {
      border-radius: 4px;
      padding: 8px;
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
    }
    .filter-group-button svg {
      fill: var(--affine-icon-color);
      color: var(--affine-icon-color);
      width: 20px;
      height: 20px;
    }
    .filter-group-button:hover {
      background-color: var(--affine-hover-color);
    }
    .filter-group-item {
      padding: 4px 0;
      display: flex;
      align-items: start;
      gap: 8px;
    }
    .filter-group-item-delete {
      margin-top: 4px;
      padding: 4px;
      border-radius: 4px;
      height: max-content;
      display: flex;
      cursor: pointer;
    }
    .filter-group-item-delete:hover {
      background-color: var(--affine-hover-color);
    }
    .filter-group-item-delete svg {
      fill: var(--affine-icon-color);
      color: var(--affine-icon-color);
      width: 18px;
      height: 18px;
    }
  `;
  @property({ attribute: false })
  data!: FilterGroup;

  @property({ attribute: false })
  vars!: Variable[];

  @query('.add-new')
  addNew!: HTMLElement;

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

  private _addNew = () => {
    popAddNewFilter(this.addNew, {
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

  private _deleteCondition(i: number) {
    const conditions = [...this.data.conditions];
    conditions.splice(i, 1);
    this.setData({
      ...this.data,
      conditions,
    });
  }

  override render() {
    const data = this.data;
    return html`
      <div class="filter-group-container">
        ${repeat(data.conditions, (filter, i) => {
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
          return html` <div class="filter-group-item">
            <div style="margin-right: 4px;display:flex;align-items:center;">
              ${op}
            </div>
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
                      style="background-color: var(--affine-hover-color);"
                      .setData="${(v: Filter) => this._setFilter(i, v)}"
                      .vars="${this.vars}"
                      .data="${filter}"
                    ></filter-group-view>
                  `}
              <div
                class="filter-group-item-delete"
                @click="${() => this._deleteCondition(i)}"
              >
                ${MoreHorizontalIcon}
              </div>
            </div>
          </div>`;
        })}
      </div>
      <div class="filter-group-button add-new" @click="${this._addNew}">
        ${PlusIcon} Add filter
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-group-view': FilterGroupView;
  }
}

export const popAddNewFilter = (
  target: HTMLElement,
  props: {
    value: FilterGroup;
    onChange: (value: FilterGroup) => void;
    vars: Variable[];
  }
) => {
  popFilterableSimpleMenu(target, [
    {
      type: 'action',
      name: 'filter',
      select: () => {
        props.onChange({
          ...props.value,
          conditions: [...props.value.conditions, firstFilter(props.vars)],
        });
      },
    },
    {
      type: 'action',
      name: 'filter group',
      select: () => {
        props.onChange({
          ...props.value,
          conditions: [
            ...props.value.conditions,
            firstFilterInGroup(props.vars),
          ],
        });
      },
    },
  ]);
};
