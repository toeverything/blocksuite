import '../../../common/filter/filter-group.js';

import {
  CopyIcon,
  DatabaseSearchClose,
  DatabaseSearchIcon,
  DeleteIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from '@blocksuite/global/config';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { DisposableGroup } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { copyBlocks } from '../../../../__internal__/clipboard/index.js';
import { stopPropagation } from '../../../../__internal__/utils/event.js';
import { popFilterableSimpleMenu } from '../../../../components/menu/menu.js';
import { toast } from '../../../../components/toast.js';
import type { FilterGroup } from '../../../common/ast.js';
import { firstFilterByRef } from '../../../common/ast.js';
import { columnManager } from '../../../common/column-manager.js';
import { popAdvanceFilter } from '../../../common/filter/filter-group.js';
import { popSelectField } from '../../../common/ref/ref.js';
import type {
  DatabaseBlockModel,
  InsertPosition,
} from '../../../database-model.js';
import { onClickOutside } from '../../../utils/utils.js';
import type { TableViewManager } from '../../table-view-manager.js';
import { SearchState } from '../../types.js';
import { initAddNewRecordHandlers } from './index.js';

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

  .edgeless .new-record > tool-tip {
    display: none;
  }

  .show-toolbar {
    display: flex;
  }
`;

@customElement('affine-database-toolbar')
export class DatabaseToolbar extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  root!: BlockSuiteRoot;

  @property({ attribute: false })
  targetModel!: DatabaseBlockModel;

  @property({ attribute: false })
  hoverState!: boolean;

  @property({ attribute: false })
  searchState!: SearchState;

  @property({ attribute: false })
  view!: TableViewManager;

  @property({ attribute: false })
  addRow!: (position: InsertPosition) => void;

  @property({ attribute: false })
  modalMode?: boolean;

  @property({ attribute: false })
  setSearchState!: (state: SearchState) => void;

  @property({ attribute: false })
  setSearchString!: (search: string) => void;
  @property({ attribute: false })
  setFilteredRowIds!: (rowIds: string[]) => void;

  @query('.affine-database-search-input')
  private _searchInput!: HTMLInputElement;

  @query('.more-action')
  private _moreActionContainer!: HTMLDivElement;

  @query('.search-container')
  private _searchContainer!: HTMLDivElement;

  @query('.new-record')
  private _newRecord!: HTMLDivElement;

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

  private _onSearch = (event: InputEvent) => {
    const el = event.target as HTMLInputElement;
    const inputValue = el.value.trim();
    this.setSearchState(SearchState.Searching);
    if (inputValue === '') {
      this.setSearchState(SearchState.SearchInput);
    }

    this.setSearchString(inputValue);

    // When deleting the search content, the rich-text in the database row will automatically get the focus,
    // causing the search box to blur. So, here we manually make it focus.
    requestAnimationFrame(() => el.focus());
  };

  private _onSearchKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (this._searchInput.value) {
        this._searchInput.value = '';
        this.setSearchState(SearchState.SearchInput);
        this.setSearchString('');
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
    this.setSearchString('');
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
    popFilterableSimpleMenu(this._moreActionContainer, [
      {
        type: 'action',
        name: 'Copy',
        icon: CopyIcon,
        select: () => {
          copyBlocks({
            type: 'Block',
            models: [this.targetModel],
            startOffset: 0,
            endOffset: 0,
          });
          toast('Copied Database to clipboard');
        },
      },
      {
        type: 'action',
        name: 'Delete database',
        icon: DeleteIcon,
        select: () => {
          const models = [this.targetModel, ...this.targetModel.children];
          models.forEach(model => this.targetModel.page.deleteBlock(model));
        },
      },
    ]);
  };

  private _resetSearchStatus = () => {
    this._searchInput.value = '';
    this.setSearchString('');
    this.setSearchState(SearchState.SearchIcon);
  };

  private _onAddNewRecord = () => {
    if (this.readonly) return;
    this.addRow('start');
  };

  private get _filter() {
    return this.view.filter;
  }

  private set _filter(filter: FilterGroup) {
    this.view.updateFilter(filter);
  }

  private get _vars() {
    return this.targetModel.columns.map(v => ({
      id: v.id,
      name: v.name,
      type: columnManager.typeOf(v.type, v.data),
    }));
  }

  private _showFilter(event: MouseEvent) {
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

  // private _onShowModalView = () => {
  //   if (!this.modalMode) {
  //     showDatabaseTableViewModal({
  //       root: this.root,
  //       model: this.targetModel,
  //       page: this.targetModel.page,
  //     });
  //   }
  // };

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
    const filter = this.targetModel.page.awarenessStore.getFlag(
      'enable_database_filter'
    )
      ? html` <div
          @click="${this._showFilter}"
          class="affine-database-filter-button"
        >
          Filter
        </div>`
      : '';
    const searchTool = html`
      <div
        class="affine-database-search-container ${expandSearch
          ? 'search-container-expand'
          : ''}"
        @click="${onSearchIconClick}"
        @transitionend="${this._onFocusSearchInput}"
      >
        <div class="affine-database-search-input-icon">
          ${DatabaseSearchIcon}
        </div>
        <div class="search-input-container">
          <input
            placeholder="Search..."
            class="affine-database-search-input"
            @input="${this._onSearch}"
            @click="${(event: MouseEvent) => event.stopPropagation()}"
            @keydown="${this._onSearchKeydown}"
            @pointerdown=${stopPropagation}
          />
          <div class="has-tool-tip close-icon" @click="${this._clearSearch}">
            ${closeIcon}
            <tool-tip inert arrow tip-position="top" role="tooltip">
              <span class="code">Esc</span> to clear all
            </tool-tip>
          </div>
        </div>
      </div>
    `;

    const expandIcon = null;
    // this.modalMode
    //   ? null
    //   : html`<div
    //       class="affine-database-toolbar-item expand"
    //       @click="${this._onShowModalView}"
    //     >
    //       ${DatabaseExpandWide}
    //     </div>`;

    return html` <div
      class="affine-database-toolbar ${this.hoverState ? 'show-toolbar' : ''}"
    >
      ${filter}
      <div class="affine-database-toolbar-item search-container hidden">
        ${searchTool}
      </div>
      ${expandIcon}
      ${this.readonly
        ? null
        : html` <div
              class="affine-database-toolbar-item more-action ${isActiveMoreAction
                ? 'active'
                : ''}"
              @click="${this._onShowAction}"
            >
              ${MoreHorizontalIcon}
            </div>
            <div
              class="has-tool-tip affine-database-toolbar-item new-record"
              draggable="true"
              @click="${this._onAddNewRecord}"
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
