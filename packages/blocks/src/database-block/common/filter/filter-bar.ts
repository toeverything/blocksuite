import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { Filter, FilterGroup, Variable } from '../ast.js';

@customElement('filter-bar')
export class FilterBar extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    filter-bar {
      display: flex;
      gap: 8px;
    }
    .filter-group {
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
          ></filter-condition-view>`;
        }
        return html`${condition.conditions.length}`;
      })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-bar': FilterBar;
  }
}
