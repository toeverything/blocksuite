import {
  type PopupTarget,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher } from '@blocksuite/global/utils';
import {
  ArrowDownSmallIcon,
  FilterIcon,
  PlusIcon,
} from '@blocksuite/icons/lit';
import { computed, type ReadonlySignal } from '@preact/signals-core';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';

import type { Variable } from '../../../core/expression/types.js';
import type { Filter, FilterGroup } from '../../../core/filter/types.js';

import { popCreateFilter } from '../../../core/index.js';
import { popFilterGroup } from './group-panel-view.js';

export class FilterBar extends SignalWatcher(ShadowlessElement) {
  static override styles = css`
    filter-bar {
      display: flex;
      gap: 8px;
      overflow: hidden;
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
      white-space: nowrap;
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

  private _setFilter = (index: number, filter: Filter) => {
    this.onChange({
      ...this.filterGroup.value,
      conditions: this.filterGroup.value.conditions.map((v, i) =>
        index === i ? filter : v
      ),
    });
  };

  private addFilter = (e: MouseEvent) => {
    const element = popupTargetFromElement(e.target as HTMLElement);
    popCreateFilter(element, {
      vars: this.vars,
      onSelect: filter => {
        const index = this.filterGroup.value.conditions.length;
        this.onChange({
          ...this.filterGroup.value,
          conditions: [...this.filterGroup.value.conditions, filter],
        });
        requestAnimationFrame(() => {
          this.expandGroup(element, index);
        });
      },
    });
  };

  private expandGroup = (position: PopupTarget, i: number) => {
    if (this.filterGroup.value.conditions[i]?.type !== 'group') {
      return;
    }
    popFilterGroup(position, {
      vars: this.vars,
      value$: computed(() => {
        return this.filterGroup.value.conditions[i] as FilterGroup;
      }),
      onChange: filter => {
        if (filter) {
          this._setFilter(i, filter);
        } else {
          this.deleteFilter(i);
        }
      },
    });
  };

  renderAddFilter = () => {
    return html` <div
      style="height: 100%;"
      class="filter-bar-add-filter dv-icon-16 dv-round-4 dv-hover"
      @click="${this.addFilter}"
    >
      ${PlusIcon()} Add filter
    </div>`;
  };

  updateMoreFilterPanel?: () => void;

  private deleteFilter(i: number) {
    this.onChange({
      ...this.filterGroup.value,
      conditions: this.filterGroup.value.conditions.filter(
        (_, index) => index !== i
      ),
    });
  }

  override render() {
    return html`
      <div style="display: flex;align-items: center;gap: 8px;overflow-x: auto">
        ${this.renderFilters()} ${this.renderAddFilter()}
      </div>
    `;
  }

  renderCondition(i: number) {
    const condition = this.filterGroup.value.conditions[i];
    const deleteFilter = () => {
      this.deleteFilter(i);
    };
    if (!condition) {
      return;
    }
    if (condition.type === 'filter') {
      return html` <filter-condition-view
        .vars="${this.vars.value}"
        .data="${condition}"
        .setData="${(v: Filter) => this._setFilter(i, v)}"
        .onDelete="${deleteFilter}"
      ></filter-condition-view>`;
    }
    const expandGroup = (e: MouseEvent) => {
      this.expandGroup(
        popupTargetFromElement(e.currentTarget as HTMLElement),
        i
      );
    };
    const length = condition.conditions.length;
    const text = length > 1 ? `${length} rules` : `${length} rule`;
    return html` <data-view-component-button
      hoverType="border"
      .icon="${FilterIcon()}"
      @click="${expandGroup}"
      .text="${html`${text}`}"
      .postfix="${ArrowDownSmallIcon()}"
    ></data-view-component-button>`;
  }

  renderFilters() {
    return this.filterGroup.value.conditions.map((_, i) =>
      this.renderCondition(i)
    );
  }

  override updated() {
    this.updateMoreFilterPanel?.();
  }

  @property({ attribute: false })
  accessor filterGroup!: ReadonlySignal<FilterGroup>;

  @property({ attribute: false })
  accessor onChange!: (filter: FilterGroup) => void;

  @property({ attribute: false })
  accessor vars!: ReadonlySignal<Variable[]>;
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-bar': FilterBar;
  }
}
