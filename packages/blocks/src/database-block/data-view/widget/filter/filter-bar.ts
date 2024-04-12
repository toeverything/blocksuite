import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import type { ReferenceElement } from '@floating-ui/dom';
import { css, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { AddCursorIcon } from '../../../../_common/icons/index.js';
import type { Filter, FilterGroup, Variable } from '../../common/ast.js';
import { CrossIcon, FilterIcon } from '../../common/icons/index.js';
import { popCreateFilter } from '../../common/ref/ref.js';
import { createPopup, eventToVRect } from '../../utils/menu/index.js';
import { renderTemplate } from '../../utils/uni-component/render-template.js';
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
    const position = eventToVRect(e);
    popCreateFilter(position, {
      vars: this.vars,
      onSelect: filter => {
        const index = this.data.conditions.length;
        this.setData({
          ...this.data,
          conditions: [...this.data.conditions, filter],
        });
        requestAnimationFrame(() => {
          this.expandGroup(position, index);
        });
      },
    });
  };
  private expandGroup = (position: ReferenceElement, i: number) => {
    const value = this.data.conditions[i];
    if (value.type !== 'group') {
      return;
    }
    popFilterModal(position, {
      isRoot: false,
      vars: this.vars,
      value: value,
      onBack: () => {
        // do nothing
      },
      onChange: filter => this._setFilter(i, filter),
      onDelete: () => {
        this.deleteFilter(i);
      },
    });
  };
  renderMoreFilter = (count: number): TemplateResult => {
    return html` <div
      class="dv-shadow-2 dv-round-8"
      style="padding: 8px;background-color: var(--affine-background-overlay-panel-color);display:flex;flex-direction: column;gap: 8px;"
    >
      ${repeat(
        this.data.conditions.slice(count),
        (_, i) =>
          html` <div style="width: max-content;">
            ${this.renderCondition(i + count)}
          </div>`
      )}
      <div class="dv-divider-h"></div>
      ${this.renderAddFilter()}
    </div>`;
  };
  updateMoreFilterPanel?: () => void;

  showMoreFilter = (e: MouseEvent, count: number) => {
    const ins = renderTemplate(() => this.renderMoreFilter(count));
    ins.style.position = 'absolute';
    this.updateMoreFilterPanel = () => {
      const max = this.data.conditions.length;
      if (count === max) {
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
  };

  renderAddFilter = () => {
    return html` <div
      style="height: 100%;"
      class="filter-bar-add-filter dv-icon-16 dv-round-4 dv-hover"
      @click="${this.addFilter}"
    >
      ${AddCursorIcon} Add filter
    </div>`;
  };

  renderMore = (count: number) => {
    const max = this.data.conditions.length;
    if (count === max) {
      return this.renderAddFilter();
    }
    const showMore = (e: MouseEvent) => {
      this.showMoreFilter(e, count);
    };
    return html` <div
      class="filter-bar-add-filter dv-icon-16 dv-round-4 dv-hover"
      style="height: 100%;"
      @click="${showMore}"
    >
      ${max - count} More
    </div>`;
  };

  renderCondition(i: number) {
    const condition = this.data.conditions[i];
    const deleteFilter = () => {
      this.deleteFilter(i);
    };
    if (condition.type === 'filter') {
      return html` <filter-condition-view
        style="margin-right: 8px;"
        .vars="${this.vars}"
        .data="${condition}"
        .setData="${(v: Filter) => this._setFilter(i, v)}"
        .onDelete="${deleteFilter}"
      ></filter-condition-view>`;
    }
    const expandGroup = (e: MouseEvent) => {
      this.expandGroup(eventToVRect(e), i);
    };
    const length = condition.conditions.length;
    const text = length > 1 ? `${length} rules` : `${length} rule`;
    return html` <div
      style="margin-right: 8px;"
      class="filter-group-tag dv-icon-16 dv-border dv-round-8"
    >
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

  renderFilters() {
    return this.data.conditions.map((_, i) => () => this.renderCondition(i));
  }

  override render() {
    return html`
      <component-overflow
        .renderItem="${this.renderFilters()}"
        .renderMore="${this.renderMore}"
      ></component-overflow>
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
