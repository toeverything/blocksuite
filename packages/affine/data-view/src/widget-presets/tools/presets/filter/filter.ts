import { FilterIcon } from '@blocksuite/icons/lit';
import { css, html, nothing } from 'lit';

import {
  emptyFilterGroup,
  type FilterGroup,
} from '../../../../core/common/ast.js';
import { popCreateFilter } from '../../../../core/common/ref/ref.js';
import { WidgetBase } from '../../../../core/widget/widget-base.js';

const styles = css`
  .affine-database-filter-button {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    line-height: 20px;
    padding: 2px 4px;
    border-radius: 4px;
    cursor: pointer;
  }

  .affine-database-filter-button:hover {
    background-color: var(--affine-hover-color);
  }

  .affine-database-filter-button svg {
    width: 20px;
    height: 20px;
  }
`;

export class DataViewHeaderToolsFilter extends WidgetBase {
  static override styles = styles;

  private get _filter(): FilterGroup {
    return this.view.filter$.value ?? emptyFilterGroup;
  }

  private set _filter(filter: FilterGroup) {
    this.view.filterSet(filter);
  }

  private get readonly() {
    return this.view.readonly$.value;
  }

  private addFilter(event: MouseEvent) {
    this.showToolBar(true);
    popCreateFilter(event.target as HTMLElement, {
      vars: this.view.vars$.value,
      onSelect: filter => {
        this._filter = {
          ...this._filter,
          conditions: [filter],
        };
      },
      onClose: () => {
        this.showToolBar(false);
      },
    });
    return;
  }

  override render() {
    if (this.readonly) return nothing;
    return html`<div
      @click="${this.addFilter}"
      class="affine-database-filter-button dv-icon-20"
    >
      ${FilterIcon()} Filter
    </div>`;
  }

  showToolBar(show: boolean) {
    const tools = this.closest('data-view-header-tools');
    if (tools) {
      tools.showToolBar = show;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-filter': DataViewHeaderToolsFilter;
  }
}
