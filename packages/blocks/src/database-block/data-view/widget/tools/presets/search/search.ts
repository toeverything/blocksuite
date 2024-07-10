import '../../../filter/filter-group.js';

import { baseTheme } from '@toeverything/theme';
import { css, html, unsafeCSS } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  DatabaseSearchClose,
  DatabaseSearchIcon,
} from '../../../../common/icons/index.js';
import { stopPropagation } from '../../../../utils/event.js';
import type { DataViewKanbanManager } from '../../../../view/presets/kanban/kanban-view-manager.js';
import type { DataViewTableManager } from '../../../../view/presets/table/table-view-manager.js';
import { WidgetBase } from '../../../widget-base.js';

const styles = css`
  .affine-database-search-container {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 24px;
    height: 32px;
    border-radius: 8px;
    transition: all 0.3s ease;
    overflow: hidden;
  }
  .affine-database-search-container svg {
    width: 20px;
    height: 20px;
    fill: var(--affine-icon-color);
  }

  .search-container-expand {
    overflow: visible;
    width: 138px;
    background-color: var(--affine-hover-color);
  }

  .search-input-container {
    display: flex;
    align-items: center;
  }

  .close-icon {
    display: flex;
    align-items: center;
    padding-right: 8px;
    height: 100%;
    cursor: pointer;
  }

  .affine-database-search-input-icon {
    position: absolute;
    left: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    height: max-content;
  }
  .affine-database-search-input-icon:hover {
    background: var(--affine-hover-color);
  }

  .search-container-expand .affine-database-search-input-icon {
    left: 4px;
    pointer-events: none;
  }

  .affine-database-search-input {
    flex: 1;
    width: 100%;
    padding: 0 2px 0 30px;
    border: none;
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    font-size: var(--affine-font-sm);
    box-sizing: border-box;
    color: inherit;
    background: transparent;
    outline: none;
  }

  .affine-database-search-input::placeholder {
    color: var(--affine-placeholder-color);
    font-size: var(--affine-font-sm);
  }
`;

@customElement('data-view-header-tools-search')
export class DataViewHeaderToolsSearch extends WidgetBase {
  get showSearch(): boolean {
    return this._showSearch;
  }

  set showSearch(value: boolean) {
    this._showSearch = value;
    const tools = this.closest('data-view-header-tools');
    if (tools) {
      tools.showToolBar = value;
    }
  }

  static override styles = styles;

  @query('.affine-database-search-input')
  private accessor _searchInput!: HTMLInputElement;

  @state()
  private accessor _showSearch = false;

  public override accessor view!: DataViewTableManager | DataViewKanbanManager;

  preventBlur = false;

  private _onSearch = (event: InputEvent) => {
    const el = event.target as HTMLInputElement;
    const inputValue = el.value.trim();
    this.view.setSearch(inputValue);
  };

  private _onSearchBlur = () => {
    if (this._searchInput.value || this.preventBlur) {
      return;
    }
    this.showSearch = false;
  };

  private _onSearchKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (this._searchInput.value) {
        this._searchInput.value = '';
        this.view.setSearch('');
      } else {
        this.showSearch = false;
      }
    }
  };

  private _clearSearch = () => {
    this._searchInput.value = '';
    this.view.setSearch('');
    this.preventBlur = true;
    setTimeout(() => {
      this.preventBlur = false;
    });
  };

  private _clickSearch = (e: MouseEvent) => {
    e.stopPropagation();
    this.showSearch = true;
  };

  override render() {
    const searchToolClassMap = classMap({
      'affine-database-search-container': true,
      'search-container-expand': this.showSearch,
    });
    return html`
      <label class="${searchToolClassMap}" @click="${this._clickSearch}">
        <div class="affine-database-search-input-icon dv-icon-20">
          ${DatabaseSearchIcon}
        </div>
        <input
          placeholder="Search..."
          class="affine-database-search-input"
          @input="${this._onSearch}"
          @click="${(event: MouseEvent) => event.stopPropagation()}"
          @keydown="${this._onSearchKeydown}"
          @pointerdown="${stopPropagation}"
          @blur="${this._onSearchBlur}"
        />
        <div class="close-icon" @mousedown="${this._clearSearch}">
          ${DatabaseSearchClose}
          <affine-tooltip>
            <span
              style=${styleMap({
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'var(--affine-white-10)',
              })}
              >Esc</span
            >
            to clear all
          </affine-tooltip>
        </div>
      </label>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-search': DataViewHeaderToolsSearch;
  }
}
