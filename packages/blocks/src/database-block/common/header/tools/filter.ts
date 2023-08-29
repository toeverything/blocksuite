import '../../../common/filter/filter-group.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { eventToVRect } from '../../../../components/menu/index.js';
import type { FilterGroup } from '../../../common/ast.js';
import { popCreateFilter } from '../../../common/ref/ref.js';
import type { DataViewManager } from '../../data-view-manager.js';
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
  view!: DataViewManager;

  override connectedCallback() {
    super.connectedCallback();
    this.disposables.add(
      this.view.slots.update.on(() => {
        this.requestUpdate();
      })
    );
  }

  private get _filter() {
    return this.view.filter;
  }

  private set _filter(filter: FilterGroup) {
    this.view.updateFilter(filter);
  }

  showToolBar(show: boolean) {
    const tools = this.closest('data-view-header-tools');
    if (tools) {
      tools.showToolBar = show;
    }
  }

  private addFilter(event: MouseEvent) {
    if (!this._filter.conditions.length) {
      this.showToolBar(true);
      popCreateFilter(eventToVRect(event), {
        vars: this.view.vars,
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
    this.view.filterSetVisible(!this.view.filterVisible);
  }

  override render() {
    const showFilter = this.closest(
      'affine-database'
    )?.root.page.awarenessStore.getFlag('enable_database_filter');
    if (!showFilter) {
      return;
    }
    return html` <div
      @click="${this.addFilter}"
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
