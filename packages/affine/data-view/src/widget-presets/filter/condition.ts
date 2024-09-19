import { popFilterableSimpleMenu } from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/global/utils';
import { CloseIcon } from '@blocksuite/icons/lit';
import { css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  type FilterGroup,
  firstFilter,
  firstFilterByRef,
  firstFilterInGroup,
  getRefType,
  type SingleFilter,
  type Variable,
  type VariableOrProperty,
} from '../../core/common/ast.js';
import {
  popLiteralEdit,
  renderLiteral,
} from '../../core/common/literal/matcher.js';
import { tBoolean } from '../../core/logical/data-type.js';
import { typesystem } from '../../core/logical/typesystem.js';
import { filterMatcher } from './matcher/matcher.js';

export class FilterConditionView extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    filter-condition-view {
      display: flex;
      align-items: center;
      padding: 4px;
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

  private _setRef = (ref: VariableOrProperty) => {
    this.setData(firstFilterByRef(this.vars, ref));
  };

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

  private _filterLabel() {
    return filterMatcher.find(v => v.data.name === this.data.function)?.data
      .label;
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
      list.map(v => {
        const selected = v.name === this.data.function;
        return {
          type: 'action',
          name: v.label,
          isSelected: selected,
          select: () => {
            this.setData({
              ...this.data,
              function: v.name,
            });
          },
        };
      })
    );
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
          const onChange = (value: unknown) => {
            const newArr = this.data.args.slice();
            newArr[i] = { type: 'literal', value };
            this.setData({
              ...this.data,
              args: newArr,
            });
          };
          const click = (e: MouseEvent) => {
            popLiteralEdit(
              e.currentTarget as HTMLElement,
              v,
              value?.value,
              onChange
            );
          };
          return html` <div
            class="dv-hover dv-round-4 filter-condition-arg"
            @click="${click}"
          >
            ${renderLiteral(v, value?.value, onChange)}
          </div>`;
        })}
      </div>
      ${this.onDelete
        ? html` <div
            @click="${this.onDelete}"
            class="dv-icon-16 dv-round-4 dv-pd-4 dv-hover"
            style="display:flex;align-items:center;"
          >
            ${CloseIcon()}
          </div>`
        : nothing}
    `;
  }

  @property({ attribute: false })
  accessor data!: SingleFilter;

  @property({ attribute: false })
  accessor onDelete: (() => void) | undefined = undefined;

  @property({ attribute: false })
  accessor setData!: (filter: SingleFilter) => void;

  @property({ attribute: false })
  accessor vars!: Variable[];
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
