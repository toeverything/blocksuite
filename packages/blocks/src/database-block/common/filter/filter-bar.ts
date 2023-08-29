import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { CrossIcon, FilterIcon } from '../../../icons/index.js';
import type { Filter, FilterGroup, Variable } from '../ast.js';

@customElement('filter-bar')
export class FilterBar extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    filter-bar {
      display: flex;
      gap: 8px;
    }

    .filter-group-tag {
      font-size: 12px;
      font-style: normal;
      font-weight: 600;
      line-height: 20px;
      display: flex;
      align-items: center;
      padding: 4px;
      background-color: var(--affine-white);
    }
  `;
  @property({ attribute: false })
  data!: FilterGroup;

  @property({ attribute: false })
  vars!: Variable[];

  @property({ attribute: false })
  setData!: (filter: FilterGroup) => void;
  private _setFilter = (index: number, filter: Filter) => {
    this.setData({
      ...this.data,
      conditions: this.data.conditions.map((v, i) =>
        index === i ? filter : v
      ),
    });
  };

  override render() {
    return html`
      ${repeat(this.data.conditions, (condition, i) => {
        if (condition.type === 'filter') {
          return html`<filter-condition-view
            .vars=${this.vars}
            .data=${condition}
            .setData="${(v: Filter) => this._setFilter(i, v)}"
            .showDelete=${true}
          ></filter-condition-view>`;
        }
        const length = condition.conditions.length;
        const text = length > 1 ? `${length} rules` : `${length} rule`;
        return html` <div
          class="filter-group-tag dv-icon-16 dv-border dv-round-8"
        >
          <div
            class="dv-round-4 dv-hover"
            style="display:flex;gap: 6px;padding: 0 4px;align-items:center;height: 100%;"
          >
            ${FilterIcon} ${text}
          </div>
          <div
            class="dv-icon-16 dv-round-4 dv-pd-4 dv-hover"
            style="display:flex;align-items:center;margin-left: 16px;"
          >
            ${CrossIcon}
          </div>
        </div>`;
      })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-bar': FilterBar;
  }
}
