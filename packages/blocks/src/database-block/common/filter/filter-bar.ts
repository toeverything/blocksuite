import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { createPopup, eventToVRect } from '../../../components/menu/index.js';
import { renderTemplate } from '../../../components/uni-component/uni-component.js';
import { AddCursorIcon, CrossIcon, FilterIcon } from '../../../icons/index.js';
import type { Filter, FilterGroup, Variable } from '../ast.js';
import type { DataViewManager } from '../data-view-manager.js';
import { popCreateFilter } from '../ref/ref.js';
import { popFilterModal } from './filter-modal.js';

@customElement('filter-bar')
export class FilterBar extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    filter-bar {
      margin-top: 8px;
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

    .filter-bar-add-filter {
      color: var(--affine-text-secondary-color);
      padding: 4px 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 22px;
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
  override updated() {
    this.updateMoreFilterPanel?.();
  }
  private addFilter = (e: MouseEvent) => {
    popCreateFilter(eventToVRect(e), {
      vars: this.vars,
      onSelect: filter => {
        const index = this.data.conditions.length;
        this.setData({
          ...this.data,
          conditions: [...this.data.conditions, filter],
        });
        requestAnimationFrame(() => {
          this.expandGroup(e, index);
        });
      },
    });
  };
  private expandGroup = (e: MouseEvent, i: number) => {
    const value = this.data.conditions[i];
    if (value.type !== 'group') {
      return;
    }
    popFilterModal(eventToVRect(e), {
      isRoot: false,
      vars: this.vars,
      value: value,
      onChange: filter => this._setFilter(i, filter),
      onDelete: () => {
        this.deleteFilter(i);
      },
    });
  };
  renderMoreFilter = (): TemplateResult => {
    return html` <div
      class="dv-shadow-2 dv-round-8"
      style="padding: 8px;background-color: var(--affine-background-overlay-panel-color);display:flex;flex-direction: column;gap: 8px;"
    >
      ${repeat(
        this.data.conditions.slice(2),
        (_, i) =>
          html` <div style="width: max-content;">
            ${this.renderCondition(i + 2)}
          </div>`
      )}
      <div class="dv-divider-h"></div>
      ${this.renderAddFilter()}
    </div>`;
  };
  updateMoreFilterPanel?: () => void;

  showMoreFilter(e: MouseEvent) {
    const ins = renderTemplate(this.renderMoreFilter);
    ins.style.position = 'absolute';
    this.updateMoreFilterPanel = () => {
      if (this.data.conditions.length <= 2) {
        close();
        this.updateMoreFilterPanel = undefined;
        return;
      }
      ins.requestUpdate();
    };
    const close = createPopup(eventToVRect(e), ins, {
      onClose: () => {
        this.updateMoreFilterPanel = undefined;
      },
    });
  }

  renderAddFilter() {
    return html` <div
      class="filter-bar-add-filter dv-icon-16 dv-round-4 dv-hover"
      @click="${this.addFilter}"
    >
      ${AddCursorIcon} Add filter
    </div>`;
  }

  renderAddFilterOrMore() {
    const count = this.data.conditions.length;
    if (count <= 2) {
      return this.renderAddFilter();
    }
    return html` <div
      class="filter-bar-add-filter dv-icon-16 dv-round-4 dv-hover"
      @click="${this.showMoreFilter}"
    >
      ${count - 2} More
    </div>`;
  }

  renderCondition(i: number) {
    const condition = this.data.conditions[i];
    const deleteFilter = () => {
      this.deleteFilter(i);
    };
    if (condition.type === 'filter') {
      return html` <filter-condition-view
        .vars="${this.vars}"
        .data="${condition}"
        .setData="${(v: Filter) => this._setFilter(i, v)}"
        .onDelete="${deleteFilter}"
      ></filter-condition-view>`;
    }
    const expandGroup = (e: MouseEvent) => {
      this.expandGroup(e, i);
    };
    const length = condition.conditions.length;
    const text = length > 1 ? `${length} rules` : `${length} rule`;
    return html` <div class="filter-group-tag dv-icon-16 dv-border dv-round-8">
      <div
        class="dv-round-4 dv-hover"
        @click="${expandGroup}"
        style="display:flex;gap: 6px;padding: 0 4px;align-items:center;height: 100%;"
      >
        ${FilterIcon} ${text}
      </div>
      <div
        class="dv-icon-16 dv-round-4 dv-pd-4 dv-hover"
        style="display:flex;align-items:center;margin-left: 16px;"
        @click="${deleteFilter}"
      >
        ${CrossIcon}
      </div>
    </div>`;
  }

  override render() {
    const conditions = this.data.conditions;
    return html`
      ${repeat(conditions.slice(0, 2), (_, i) => this.renderCondition(i))}
      ${this.renderAddFilterOrMore()}
    `;
  }

  private deleteFilter(i: number) {
    this.setData({
      ...this.data,
      conditions: this.data.conditions.filter((_, index) => index !== i),
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-bar': FilterBar;
  }
}
export const renderFilterBar = (view?: DataViewManager) => {
  if (!view || !view.filterVisible) {
    return;
  }
  return html`<filter-bar
    .vars=${view.vars}
    .data=${view.filter}
    .setData=${view.updateFilter.bind(view)}
  ></filter-bar>`;
};
