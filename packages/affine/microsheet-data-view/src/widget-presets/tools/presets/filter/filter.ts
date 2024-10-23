import { popupTargetFromElement } from '@blocksuite/affine-components/context-menu';
import { FilterIcon } from '@blocksuite/icons/lit';
import { computed } from '@preact/signals-core';
import { cssVarV2 } from '@toeverything/theme/v2';
import { css, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import {
  emptyFilterGroup,
  type FilterGroup,
} from '../../../../core/common/ast.js';
import { popCreateFilter } from '../../../../core/common/ref/ref.js';
import { WidgetBase } from '../../../../core/widget/widget-base.js';
import { ShowFilterContextKey } from '../../../filter/context.js';

const styles = css`
  .affine-microsheet-filter-button {
    display: flex;
    align-items: center;
    gap: 6px;
    line-height: 20px;
    padding: 2px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 20px;
  }

  .affine-microsheet-filter-button:hover {
    background-color: var(--affine-hover-color);
  }

  .affine-microsheet-filter-button {
  }
`;

export class DataViewHeaderToolsFilter extends WidgetBase {
  static override styles = styles;

  hasFilter = computed(() => {
    return this.view.filter$.value.conditions.length > 0;
  });

  private get _filter(): FilterGroup {
    return this.view.filter$.value ?? emptyFilterGroup;
  }

  private set _filter(filter: FilterGroup) {
    this.view.filterSet(filter);
  }

  private get readonly() {
    return this.view.readonly$.value;
  }

  private clickFilter(event: MouseEvent) {
    if (this.hasFilter.value) {
      this.toggleShowFilter();
      return;
    }
    this.showToolBar(true);
    popCreateFilter(
      popupTargetFromElement(event.currentTarget as HTMLElement),
      {
        vars: this.view.vars$,
        onSelect: filter => {
          this._filter = {
            ...this._filter,
            conditions: [filter],
          };
          this.toggleShowFilter(true);
        },
        onClose: () => {
          this.showToolBar(false);
        },
      }
    );
    return;
  }

  override render() {
    if (this.readonly) return nothing;
    const style = styleMap({
      color: this.hasFilter.value
        ? cssVarV2('text/emphasis')
        : cssVarV2('icon/primary'),
    });
    return html` <div
      @click="${this.clickFilter}"
      style="${style}"
      class="affine-microsheet-filter-button"
    >
      ${FilterIcon()}
    </div>`;
  }

  showToolBar(show: boolean) {
    const tools = this.closest('data-view-header-tools');
    if (tools) {
      tools.showToolBar = show;
    }
  }

  toggleShowFilter(show?: boolean) {
    const map = this.view.contextGet(ShowFilterContextKey);
    map.value = {
      ...map.value,
      [this.view.id]: show ?? !map.value[this.view.id],
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-filter': DataViewHeaderToolsFilter;
  }
}
