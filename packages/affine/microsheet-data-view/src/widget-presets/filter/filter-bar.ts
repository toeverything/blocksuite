import {
  createPopup,
  type PopupTarget,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher } from '@blocksuite/global/utils';
import { CloseIcon, FilterIcon, PlusIcon } from '@blocksuite/icons/lit';
import { computed, type ReadonlySignal } from '@preact/signals-core';
import { css, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { Filter, FilterGroup, Variable } from '../../core/common/ast.js';

import { popCreateFilter } from '../../core/common/ref/ref.js';
import { renderTemplate } from '../../core/utils/uni-component/render-template.js';
import { popFilterGroup } from './filter-modal.js';

export class FilterBar extends SignalWatcher(ShadowlessElement) {
  static override styles = css`
    microsheet-filter-bar {
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

    .microsheet-filter-bar-add-filter {
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
      class="microsheet-filter-bar-add-filter dv-icon-16 dv-round-4 dv-hover"
      @click="${this.addFilter}"
    >
      ${PlusIcon()} Add filter
    </div>`;
  };

  renderMore = (count: number) => {
    const max = this.filterGroup.value.conditions.length;
    if (count === max) {
      return this.renderAddFilter();
    }
    const showMore = (e: MouseEvent) => {
      this.showMoreFilter(e, count);
    };
    return html` <div
      class="microsheet-filter-bar-add-filter dv-icon-16 dv-round-4 dv-hover"
      style="height: 100%;"
      @click="${showMore}"
    >
      ${max - count} More
    </div>`;
  };

  renderMoreFilter = (count: number): TemplateResult => {
    return html` <div
      class="dv-shadow-2 dv-round-8"
      style="padding: 8px;background-color: var(--affine-background-overlay-panel-color);display:flex;flex-direction: column;gap: 8px;"
    >
      ${repeat(
        this.filterGroup.value.conditions.slice(count),
        (_, i) =>
          html` <div style="width: max-content;">
            ${this.renderCondition(i + count)}
          </div>`
      )}
      <div class="dv-divider-h"></div>
      ${this.renderAddFilter()}
    </div>`;
  };

  showMoreFilter = (e: MouseEvent, count: number) => {
    const ins = renderTemplate(() => this.renderMoreFilter(count));
    ins.style.position = 'absolute';
    this.updateMoreFilterPanel = () => {
      const max = this.filterGroup.value.conditions.length;
      if (count === max) {
        close();
        this.updateMoreFilterPanel = undefined;
        return;
      }
      ins.requestUpdate();
    };
    const close = createPopup(
      popupTargetFromElement(e.target as HTMLElement),
      ins,
      {
        onClose: () => {
          this.updateMoreFilterPanel = undefined;
        },
      }
    );
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
      <microsheet-component-overflow
        .renderItem="${this.renderFilters()}"
        .renderMore="${this.renderMore}"
      ></microsheet-component-overflow>
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
      return html` <microsheet-filter-condition-view
        style="margin-right: 8px;"
        .vars="${this.vars.value}"
        .data="${condition}"
        .setData="${(v: Filter) => this._setFilter(i, v)}"
        .onDelete="${deleteFilter}"
      ></microsheet-filter-condition-view>`;
    }
    const expandGroup = (e: MouseEvent) => {
      const element = (e.currentTarget as HTMLElement)
        .parentElement as HTMLElement;
      this.expandGroup(popupTargetFromElement(element), i);
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
        ${FilterIcon()} ${text}
      </div>
      <div
        class="dv-icon-16 dv-round-4 dv-pd-4 dv-hover"
        style="display:flex;align-items:center;margin-left: 16px;"
        @click="${deleteFilter}"
      >
        ${CloseIcon()}
      </div>
    </div>`;
  }

  renderFilters() {
    return this.filterGroup.value.conditions.map(
      (_, i) => () => this.renderCondition(i)
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
    'microsheet-filter-bar': FilterBar;
  }
}
