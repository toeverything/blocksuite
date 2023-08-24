import '../../../common/filter/filter-group.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { FilterGroup } from '../../../common/ast.js';
import { firstFilterByRef } from '../../../common/ast.js';
import { columnManager } from '../../../common/columns/manager.js';
import { popSelectField } from '../../../common/ref/ref.js';
import type { DataViewTableManager } from '../../../table/table-view-manager.js';
import { popAdvanceFilter } from '../../filter/filter-modal.js';
import { viewOpIcons } from './view-options.js';

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

@customElement('data-view-header-tools-filter')
export class DataViewHeaderToolsFilter extends WithDisposable(
  ShadowlessElement
) {
  static override styles = styles;

  @property({ attribute: false })
  view!: DataViewTableManager;

  private get _filter() {
    return this.view.filter;
  }

  private set _filter(filter: FilterGroup) {
    this.view.updateFilter(filter);
  }

  private get _vars() {
    return this.view.columnManagerList.map(v => ({
      id: v.id,
      name: v.name,
      type: columnManager.getColumn(v.type).dataType(v.data),
      icon: v.icon,
    }));
  }

  showToolBar(show: boolean) {
    const tools = this.closest('data-view-header-tools');
    if (tools) {
      tools.showToolBar = show;
    }
  }

  private _showFilter(event: MouseEvent) {
    this.showToolBar(true);
    const popAdvance = () => {
      popAdvanceFilter(event.target as HTMLElement, {
        vars: this._vars,
        value: this._filter,
        onChange: group => {
          this._filter = group;
        },
      });
    };
    if (!this._filter.conditions.length) {
      popSelectField(event.target as HTMLElement, {
        vars: this._vars,
        onSelect: ref => {
          this._filter = {
            ...this._filter,
            conditions: [firstFilterByRef(this._vars, ref)],
          };
          setTimeout(() => {
            popAdvance();
          });
        },
      });
      return;
    }
    popAdvance();
  }

  override render() {
    const showFilter = this.closest(
      'affine-database'
    )?.root.page.awarenessStore.getFlag('enable_database_filter');
    if (!showFilter) {
      return;
    }
    return html`<div
      @click="${this._showFilter}"
      class="affine-database-filter-button"
    >
      ${viewOpIcons.filter} Filter
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-filter': DataViewHeaderToolsFilter;
  }
}
