import '../ref/ref.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { popFilterableSimpleMenu } from '../../../components/menu/menu.js';
import { tBoolean } from '../../logical/data-type.js';
import { filterMatcher } from '../../logical/filter-matcher.js';
import { typesystem } from '../../logical/typesystem.js';
import type { SingleFilter, Variable, VariableOrProperty } from '../ast.js';
import { firstFilterByRef, getRefType } from '../ast.js';
import { renderLiteral } from '../literal/index.js';

@customElement('filter-condition-view')
export class FilterConditionView extends WithDisposable(ShadowlessElement) {
  static override styles = css``;
  @property({ attribute: false })
  data!: SingleFilter;

  @property({ attribute: false })
  setData!: (filter: SingleFilter) => void;

  @property({ attribute: false })
  vars!: Variable[];
  @query('.filter-select')
  filterSelect!: HTMLElement;

  private _setRef = (ref: VariableOrProperty) => {
    this.setData(firstFilterByRef(this.vars, ref));
  };

  private _filterLabel() {
    return this.data.function;
  }

  private _filterList() {
    const type = getRefType(this.vars, this.data.left);
    if (!type) {
      return [];
    }
    return filterMatcher.allMatchedData(type);
  }

  private _selectFilter() {
    const list = this._filterList();
    popFilterableSimpleMenu(
      this.filterSelect,
      list.map(v => ({
        type: 'action',
        name: v.name,
        select: () => {
          this.setData({
            ...this.data,
            function: v.name,
          });
        },
      }))
    );
  }

  private _args() {
    const fn = filterMatcher.find(v => v.data.name === this.data.function);
    if (!fn) {
      return [];
    }
    const refType = getRefType(this.vars, this.data.left);
    if (!refType) {
      return [];
    }
    const type = typesystem.instance({}, [refType], tBoolean.create(), fn.type);
    return type.args.slice(1);
  }

  override render() {
    const data = this.data;

    return html`
      <div style="display:flex;align-items:center;white-space: nowrap">
        <variable-ref-view
          .data="${data.left}"
          .setData="${this._setRef}"
          .vars="${this.vars}"
          style="margin-right: 4px;"
        ></variable-ref-view>
        <div style="margin-right: 4px;display:flex;align-items:center;">
          <div class="filter-select" @click="${this._selectFilter}">
            ${this._filterLabel()}
          </div>
        </div>
        <div>
          ${repeat(this._args(), (v, i) => {
            const value = this.data.args[i];
            return renderLiteral(v, value?.value, value => {
              const newArr = this.data.args.slice();
              newArr[i] = { type: 'literal', value };
              this.setData({
                ...this.data,
                args: newArr,
              });
            });
          })}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-condition-view': FilterConditionView;
  }
}
