import '../ref/ref.js';
import '../literal/define.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { popFilterableSimpleMenu } from '../../../components/menu/menu.js';
import { CrossIcon } from '../../../icons/index.js';
import { tBoolean } from '../../logical/data-type.js';
import { filterMatcher } from '../../logical/filter-matcher.js';
import { typesystem } from '../../logical/typesystem.js';
import type {
  FilterGroup,
  SingleFilter,
  Variable,
  VariableOrProperty,
} from '../ast.js';
import {
  firstFilter,
  firstFilterByRef,
  firstFilterInGroup,
  getRefType,
} from '../ast.js';
import { renderLiteral } from '../literal/matcher.js';

@customElement('filter-condition-view')
export class FilterConditionView extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    filter-condition-view {
      display: flex;
      align-items: center;
      padding: 4px 8px 4px 4px;
      gap: 16px;
      border: 1px solid var(--affine-border-color);
      border-radius: 8px;
      background-color: var(--affine-white);
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
  `;
  @property({ attribute: false })
  data!: SingleFilter;

  @property({ attribute: false })
  setData!: (filter: SingleFilter) => void;

  @property({ attribute: false })
  vars!: Variable[];
  @property({ attribute: false })
  showDelete = false;

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

  private _selectFilter(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement;
    const list = this._filterList();
    popFilterableSimpleMenu(
      target,
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
      <div class="filter-condition-expression">
        <variable-ref-view
          .data="${data.left}"
          .setData="${this._setRef}"
          .vars="${this.vars}"
          style="height: 24px"
        ></variable-ref-view>
        <div
          class="filter-condition-function-name"
          @click="${this._selectFilter}"
        >
          ${this._filterLabel()}
        </div>
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
      ${this.showDelete
        ? html`<div class="filter-condition-delete">${CrossIcon}</div>`
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-condition-view': FilterConditionView;
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
      name: 'Add filter',
      select: () => {
        props.onChange({
          ...props.value,
          conditions: [...props.value.conditions, firstFilter(props.vars)],
        });
      },
    },
    {
      type: 'action',
      name: 'Add filter group',
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
