import './toolbar-action-popup.js';

import {
  DatabaseSearchClose,
  DatabaseSearchIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from '@blocksuite/global/config';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { DisposableGroup } from '@blocksuite/store';
import { computePosition } from '@floating-ui/dom';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { stopPropagation } from '../../../../page-block/edgeless/utils.js';
import type { DatabaseBlockModel } from '../../../database-model.js';
import { onClickOutside } from '../../../utils.js';
import { SearchState } from '../../types.js';
import { initAddNewRecordHandlers } from './index.js';
import { ToolbarActionPopup } from './toolbar-action-popup.js';

type CellValues = string[];

/**
 * Containing all the cell values in rows.
 * ```
 * { rowId: CellValues }
 * ```
 */
type DatabaseMap = Record<string, CellValues>;

const styles = css`
  .affine-database-toolbar {
    display: none;
    align-items: center;
    gap: 26px;
  }
  .affine-database-toolbar-search svg,
  .affine-database-toolbar svg {
    width: 16px;
    height: 16px;
    fill: var(--affine-icon-color);
  }
  .affine-database-toolbar-item {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .search-container.hidden {
    overflow: hidden;
  }
  .affine-database-toolbar-item.more-action {
    width: 32px;
    height: 32px;
    border-radius: 4px;
  }
  .affine-database-toolbar-item.more-action:hover,
  .more-action.active {
    background: var(--affine-hover-color);
  }
  .affine-database-search-container {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 16px;
    height: 32px;
    padding: 8px 0;
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  .affine-database-search-container > svg {
    min-width: 16px;
    min-height: 16px;
  }
  .search-container-expand {
    width: 138px;
    padding: 8px 12px;
    background-color: var(--affine-hover-color);
  }
  .search-input-container {
    display: flex;
    align-items: center;
  }
  .search-input-container > .close-icon {
    display: flex;
    align-items: center;
  }
  .close-icon .code {
    width: 31px;
    height: 18px;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--affine-white-10);
  }
  .affine-database-search-input-icon {
    display: inline-flex;
  }
  .affine-database-search-input {
    flex: 1;
    height: 16px;
    width: 80px;
    border: none;
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    box-sizing: border-box;
    color: inherit;
    background: transparent;
  }
  .affine-database-search-input:focus {
    outline: none;
  }
  .affine-database-search-input::placeholder {
    color: var(--affine-placeholder-color);
    font-size: var(--affine-font-sm);
  }

  .affine-database-toolbar-item.new-record {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 120px;
    height: 32px;
    padding: 6px 8px;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.05),
      0px 0px 0px 0.5px var(--affine-black-10);
    background: linear-gradient(
        0deg,
        var(--affine-hover-color),
        var(--affine-hover-color)
      ),
      var(--affine-white);
  }
  .new-record > tool-tip {
    max-width: 280px;
  }

  .show-toolbar {
    display: flex;
  }
`;

@customElement('affine-database-toolbar')
export class DatabaseToolbar extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property()
  targetModel!: DatabaseBlockModel;

  @property()
  hoverState!: boolean;

  @property()
  searchState!: SearchState;

  @property()
  addRow!: (index?: number) => void;

  @property()
  setSearchState!: (state: SearchState) => void;

  @property()
  setFilteredRowIds!: (rowIds: string[]) => void;

  @query('.affine-database-search-input')
  private _searchInput!: HTMLInputElement;

  @query('.more-action')
  private _moreActionContainer!: HTMLDivElement;

  @query('.search-container')
  private _searchContainer!: HTMLDivElement;

  @query('.new-record')
  private _newRecord!: HTMLDivElement;

  private _toolbarAction!: ToolbarActionPopup | undefined;
  private _recordAddDisposables = new DisposableGroup();

  private get readonly() {
    return this.targetModel.page.readonly;
  }

  override firstUpdated() {
    if (!this.readonly) {
      this._initAddRecordHandlers();
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    if (!this.readonly) {
      this._initAddRecordHandlers();
    }
  }

  private _initAddRecordHandlers() {
    // remove previous handlers
    this._recordAddDisposables.dispose();

    const disposables = initAddNewRecordHandlers(
      this._newRecord,
      this,
      this.addRow
    );
    if (disposables) {
      // bind new handlers
      this._recordAddDisposables = disposables;
    }
  }

  private get _databaseMap() {
    const databaseMap: DatabaseMap = {};
    for (const child of this.targetModel.children) {
      // The first value is the text context of the row block
      databaseMap[child.id] = [child.text?.toString() ?? ''];
    }

    const { cells } = this.targetModel;
    const rowIds = this.targetModel.children.map(child => child.id);

    rowIds.forEach(rowId => {
      // The map containing all columns related to this row (block)
      const columnMap = cells[rowId];
      if (!columnMap) return;

      // Flatten the columnMap into a list of values
      const columnValues = Object.keys(columnMap).map(key => {
        const value = columnMap[key].value;
        if (Array.isArray(value)) {
          return value.map(item => item.value);
        }
        return columnMap[key].value + '';
      });
      databaseMap[rowId].push(...columnValues.flat());
    });

    return databaseMap;
  }

  private _onSearch = (event: InputEvent) => {
    const el = event.target as HTMLInputElement;
    const inputValue = el.value.trim();
    this.setSearchState(SearchState.Searching);
    if (inputValue === '') {
      this.setSearchState(SearchState.SearchInput);
    }

    const { _databaseMap } = this;
    const existingRowIds = Object.keys(_databaseMap).filter(key => {
      return (
        _databaseMap[key].findIndex(item =>
          item.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())
        ) > -1
      );
    });

    const filteredRowIds = this.targetModel.children
      .filter(child => existingRowIds.includes(child.id))
      .map(child => child.id);
    this.setFilteredRowIds(filteredRowIds);

    // When deleting the search content, the rich-text in the database row will automatically get the focus,
    // causing the search box to blur. So, here we manually make it focus.
    requestAnimationFrame(() => el.focus());
  };

  private _onSearchKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (this._searchInput.value) {
        this._searchInput.value = '';
        this.setSearchState(SearchState.SearchInput);
      } else {
        this._resetSearchStatus();
        this._searchContainer.classList.add('hidden');
      }
    }
  };

  private _clearSearch = (event: MouseEvent) => {
    event.stopPropagation();
    this._searchInput.value = '';
    this.setSearchState(SearchState.SearchInput);
  };

  private _onShowSearch = () => {
    this.setSearchState(SearchState.SearchInput);
    const removeListener = onClickOutside(
      this._searchContainer,
      () => {
        if (this.searchState !== SearchState.Searching) {
          this._searchContainer.classList.add('hidden');
          this.setSearchState(SearchState.SearchIcon);
          removeListener();
        }
      },
      'click',
      true
    );
  };

  private _onFocusSearchInput = () => {
    if (this.searchState === SearchState.SearchInput) {
      this._searchInput.focus();
      this._searchContainer.classList.remove('hidden');
    } else {
      this._searchInput.blur();
    }
  };

  private _onShowAction = () => {
    if (this.readonly) return;

    if (this._toolbarAction) {
      this._closeToolbarAction();
      return;
    }
    this.setSearchState(SearchState.Action);
    const toolbarAction = new ToolbarActionPopup();
    toolbarAction.targetModel = this.targetModel;
    toolbarAction.close = this._closeToolbarAction;
    this._toolbarAction = toolbarAction;
    this._moreActionContainer.appendChild(this._toolbarAction);
    computePosition(this._moreActionContainer, this._toolbarAction, {
      placement: 'bottom',
    }).then(({ x, y }) => {
      Object.assign(toolbarAction.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });

    onClickOutside(
      this._moreActionContainer,
      () => {
        this._closeToolbarAction();
      },
      'mousedown'
    );
  };

  private _closeToolbarAction = () => {
    this._toolbarAction?.remove();
    this._toolbarAction = undefined;
  };

  private _resetSearchStatus = () => {
    this._searchInput.value = '';
    this.setFilteredRowIds([]);
    this.setSearchState(SearchState.SearchIcon);
  };

  private _onAddNewRecord = () => {
    if (this.readonly) return;
    this.addRow(0);
  };

  override render() {
    const expandSearch =
      this.searchState === SearchState.SearchInput ||
      this.searchState === SearchState.Searching;
    const isActiveMoreAction = this.searchState === SearchState.Action;

    const onSearchIconClick = expandSearch ? undefined : this._onShowSearch;

    const closeIcon = this._searchInput
      ? this._searchInput.value === ''
        ? null
        : DatabaseSearchClose
      : null;

    const searchTool = html`
      <div
        class="affine-database-search-container ${expandSearch
          ? 'search-container-expand'
          : ''}"
        @click=${onSearchIconClick}
        @transitionend=${this._onFocusSearchInput}
      >
        <div class="affine-database-search-input-icon">
          ${DatabaseSearchIcon}
        </div>
        <div class="search-input-container">
          <input
            placeholder="Search..."
            class="affine-database-search-input"
            @input=${this._onSearch}
            @click=${(event: MouseEvent) => event.stopPropagation()}
            @keydown=${this._onSearchKeydown}
            @pointerdown=${stopPropagation}
          />
          <div class="has-tool-tip close-icon" @click=${this._clearSearch}>
            ${closeIcon}
            <tool-tip inert arrow tip-position="top" role="tooltip">
              <span class="code">Esc</span> to clear all
            </tool-tip>
          </div>
        </div>
      </div>
    `;

    return html`<div
      class="affine-database-toolbar ${this.hoverState ? 'show-toolbar' : ''}"
    >
      <div class="affine-database-toolbar-item search-container hidden">
        ${searchTool}
      </div>
      ${this.readonly
        ? null
        : html`<div
              class="affine-database-toolbar-item more-action ${isActiveMoreAction
                ? 'active'
                : ''}"
              @click=${this._onShowAction}
            >
              ${MoreHorizontalIcon}
            </div>
            <div
              class="has-tool-tip affine-database-toolbar-item new-record"
              draggable="true"
              @click=${this._onAddNewRecord}
            >
              ${PlusIcon}<span>New Record</span>
              <tool-tip inert arrow tip-position="top" role="tooltip"
                >You can drag this button to the desired location and add a
                record
              </tool-tip>
            </div>`}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-toolbar': DatabaseToolbar;
  }
}
