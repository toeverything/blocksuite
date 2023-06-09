import '../ref/ref.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { autoPlacement,computePosition } from '@floating-ui/dom';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import type {
  SingleFilter,
  Variable,
  VariableOrProperty,
} from '../../common/ast.js';
import { firstFilterName, getRefType } from '../../common/ast.js';
import { DatabaseMenuComponent } from '../../common/menu.js';
import { filterMatcher } from '../../logical/filter-matcher.js';
import { onClickOutside } from '../../utils.js';

@customElement('filter-condition-view')
export class FilterConditionView extends WithDisposable(ShadowlessElement) {
  static override styles = css``;
  @property()
  data!: SingleFilter;

  @property()
  setData!: (filter: SingleFilter) => void;

  @property()
  vars!: Variable[];
  @query('.filter-select')
  filterSelect!: HTMLElement;

  private _setRef = (ref: VariableOrProperty) => {
    this.setData({
      type: 'filter',
      left: ref,
      function: firstFilterName(this.vars, ref),
      args: [],
    });
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
    const menu = new DatabaseMenuComponent();
    menu.menuGroup = list.map(v => ({
      type: 'action',
      label: v.name,
      click: () => {
        this.setData({
          ...this.data,
          function: v.name,
        });
        menu.remove();
      },
    }));
    this.append(menu);
    computePosition(this.filterSelect, menu, {
      middleware: [
        autoPlacement({
          allowedPlacements: ['right-start', 'bottom-start'],
        }),
      ],
    }).then(({ x, y }) => {
      Object.assign(menu.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });

    onClickOutside(
      menu,
      () => {
        menu.remove();
      },
      'mousedown'
    );
  }

  override render() {
    const data = this.data;

    return html`
      <div style="display:flex;align-items:center;">
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
        <!--        <component v-for='(v,i) in inputs' :is='v.input' :key='i' :type='v.type'-->
        <!--                   v-model:value='data.args[i]'></component>-->
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-condition-view': FilterConditionView;
  }
}
