import '../../../common/filter/filter-group.js';

import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { eventToVRect } from '../../../../components/menu/index.js';
import { FilterIcon } from '../../../../icons/index.js';
import type { FilterGroup } from '../../../common/ast.js';
import { popCreateFilter } from '../../../common/ref/ref.js';
import { BaseTool } from './base-tool.js';

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
export class DataViewHeaderToolsFilter extends BaseTool {
  static override styles = styles;

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
    if (!this._filter.conditions.length && !this.view.filterVisible) {
      this.showToolBar(true);
      popCreateFilter(eventToVRect(event), {
        vars: this.view.vars,
        onSelect: filter => {
          this._filter = {
            ...this._filter,
            conditions: [filter],
          };
          this.view.filterSetVisible(true);
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
    return html` <div
      @click="${this.addFilter}"
      class="affine-database-filter-button dv-icon-20"
    >
      ${FilterIcon} Filter
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-filter': DataViewHeaderToolsFilter;
  }
}
