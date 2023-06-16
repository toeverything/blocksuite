import './condition.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { TemplateResult } from 'lit';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { Filter, FilterGroup, Variable } from '../ast.js';
import { firstFilter, firstFilterInGroup } from '../ast.js';
import { DatabaseMenuComponent, popMenu } from '../menu.js';
import { createDatabasePopup } from '../popup.js';

@customElement('filter-group-view')
export class FilterGroupView extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    filter-group-view {
      background-color: white;
    }
  `;
  @property()
  data!: FilterGroup;

  @property()
  vars!: Variable[];

  @query('.add-new')
  addNew!: HTMLElement;

  @property()
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
    const menu = new DatabaseMenuComponent();
    menu.menuGroup = [
      {
        type: 'action',
        label: 'And',
        click: () => {
          this.setData({
            ...this.data,
            op: 'and',
          });
        },
      },
      {
        type: 'action',
        label: 'Or',
        click: () => {
          this.setData({
            ...this.data,
            op: 'or',
          });
        },
      },
    ];
    createDatabasePopup(event.target as HTMLElement, menu);
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
      <div>
        ${repeat(data.conditions, (filter, i) => {
          let op: TemplateResult;
          if (i === 0) {
            op = html` <div style="padding-left: 6px;">Where</div>`;
          } else if (i === 1) {
            op = html`
              <div @click="${this._selectOp}">${this.opMap[data.op]}</div>
            `;
          } else {
            op = html`
              <div style="padding-left: 6px;">${this.opMap[data.op]}</div>
            `;
          }
          return html` <div
            style="display: flex;align-items:start;margin-bottom: 4px;"
          >
            <div style="margin-right: 4px;display:flex;align-items:center;">
              ${op}
            </div>
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
                    .setData="${(v: Filter) => this._setFilter(i, v)}"
                    .vars="${this.vars}"
                    .data="${filter}"
                  ></filter-group-view>
                `}
            <div @click="${() => this._deleteCondition(i)}">x</div>
          </div>`;
        })}
        <span class="add-new" @click="${this._addNew}">Add New</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-group-view': FilterGroupView;
  }
}

export const popAdvanceFilter = (
  target: HTMLElement,
  props: {
    vars: Variable[];
    value: FilterGroup;
    onChange: (value: FilterGroup) => void;
  }
) => {
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.zIndex = '999';
  div.style.boxShadow = '3px 3px 10px rgba(0, 0, 0, 0.1)';
  div.style.padding = '8px';
  div.style.borderRadius = '4px';
  div.style.backgroundColor = 'white';
  const filter = new FilterGroupView();
  filter.vars = props.vars;
  filter.data = props.value;
  filter.setData = group => {
    props.onChange(group);
    filter.data = group;
  };
  div.append(filter);
  createDatabasePopup(target, div);
};

export const popAddNewFilter = (
  target: HTMLElement,
  props: {
    value: FilterGroup;
    onChange: (value: FilterGroup) => void;
    vars: Variable[];
  }
) => {
  popMenu(target, {
    options: [
      {
        type: 'action',
        label: 'filter',
        click: () => {
          props.onChange({
            ...props.value,
            conditions: [...props.value.conditions, firstFilter(props.vars)],
          });
        },
      },
      {
        type: 'action',
        label: 'filter group',
        click: () => {
          props.onChange({
            ...props.value,
            conditions: [
              ...props.value.conditions,
              firstFilterInGroup(props.vars),
            ],
          });
        },
      },
    ],
  });
};
