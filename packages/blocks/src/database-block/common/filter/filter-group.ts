import './condition.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { createPopper } from '@popperjs/core';
import type { TemplateResult } from 'lit';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { Filter, FilterGroup, Variable } from '../../common/ast.js';
import { firstFilter, firstFilterInGroup } from '../../common/ast.js';
import { DatabaseMenuComponent } from '../../common/menu.js';
import { onClickOutside } from '../../utils.js';

@customElement('filter-group-view')
export class FilterGroupView extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .filter-group-view {
      background-color: white;
      padding: 8px;
      box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.1);
      border-radius: 4px;
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

  opMap = {
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
    const menu = new DatabaseMenuComponent();
    menu.menuGroup = [
      {
        type: 'action',
        label: 'filter',
        click: () => {
          this.setData({
            ...this.data,
            conditions: [...this.data.conditions, firstFilter(this.vars)],
          });
          menu.remove();
        },
      },
      {
        type: 'action',
        label: 'filter group',
        click: () => {
          this.setData({
            ...this.data,
            conditions: [
              ...this.data.conditions,
              firstFilterInGroup(this.vars),
            ],
          });
          menu.remove();
        },
      },
    ];
    this.append(menu);
    createPopper(this.addNew, menu, {
      placement: 'top',
    });
    onClickOutside(
      menu,
      () => {
        menu.remove();
      },
      'mousedown'
    );
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
          menu.remove();
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
          menu.remove();
        },
      },
    ];
    this.append(menu);
    createPopper(event.target as HTMLElement, menu, {
      placement: 'top',
    });
    onClickOutside(
      menu,
      () => {
        menu.remove();
      },
      'mousedown'
    );
  };

  override render() {
    const data = this.data;
    return html`
      <div class="filter-group-view">
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
