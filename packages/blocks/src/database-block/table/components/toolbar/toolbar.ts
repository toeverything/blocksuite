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
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { stopPropagation } from '../../../../__internal__/utils/event.js';
import { popFilterableSimpleMenu } from '../../../../components/menu/menu.js';
import { toast } from '../../../../components/toast.js';
import type { FilterGroup } from '../../../common/ast.js';
import { firstFilterByRef } from '../../../common/ast.js';
import { columnManager } from '../../../common/column-manager.js';
import { popAdvanceFilter } from '../../../common/filter/filter-group.js';
import { popSelectField } from '../../../common/ref/ref.js';
import type { InsertPosition } from '../../../types.js';
import type { DataViewTableManager } from '../../table-view-manager.js';
import { initAddNewRecordHandlers } from './index.js';

const styles = css`
  .affine-database-toolbar {
    display: none;
    align-items: center;
    gap: 26px;
  }

  .toolbar-hover-container:hover .affine-database-toolbar {
    display: flex;
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
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 16px;
    height: 32px;
    border-radius: 8px;
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .affine-database-search-container > svg {
    min-width: 16px;
    min-height: 16px;
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

  .close-icon .code {
    width: 31px;
    height: 18px;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--affine-white-10);
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
  }

  .search-container-expand .affine-database-search-input-icon {
    left: 8px;
    pointer-events: none;
  }

  .affine-database-search-input {
    flex: 1;
    width: 100%;
    padding: 0 2px 0 30px;
    border: none;
    font-family: var(--affine-font-family);
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
  copyBlock!: () => void;

  @property({ attribute: false })
  deleteSelf!: () => void;

  @property({ attribute: false })
  view!: DataViewTableManager;

  @property({ attribute: false })
  addRow!: (position: InsertPosition) => void;

  @query('.affine-database-search-input')
  private _searchInput!: HTMLInputElement;

  @query('.more-action')
  private _moreActionContainer!: HTMLDivElement;

  @query('.new-record')
  private _newRecord!: HTMLDivElement;

  private _recordAddDisposables = new DisposableGroup();

  @state()
  private showSearch = false;

  private get readonly() {
    return this.view.readonly;
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
    this.view.setSearch(inputValue);
  };
  preventBlur = false;
  private _onSearchBlur = (e: Event) => {
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

  private _clickMoreAction = () => {
    if (this.readonly) return;
    popFilterableSimpleMenu(this._moreActionContainer, [
      {
        type: 'action',
        name: 'Copy',
        icon: CopyIcon,
        select: () => {
          this.copyBlock();
          toast('Copied Database to clipboard');
        },
      },
      {
        type: 'action',
        name: 'Delete database',
        icon: DeleteIcon,
        select: () => {
          this.deleteSelf();
        },
        class: 'delete-item',
      },
    ]);
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
    return this.view.columnManagerList.map(v => ({
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

  override render() {
    const filter = this.root.page.awarenessStore.getFlag(
      'enable_database_filter'
    )
      ? html` <div
          @click="${this._showFilter}"
          class="affine-database-filter-button"
        >
          Filter
        </div>`
      : '';
    const searchToolClassMap = classMap({
      'affine-database-search-container': true,
      'search-container-expand': this.showSearch,
    });
    const searchTool = html`
      <label class="${searchToolClassMap}" @click="${this._clickSearch}">
        <div class="affine-database-search-input-icon">
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
        <div class="has-tool-tip close-icon" @mousedown="${this._clearSearch}">
          ${DatabaseSearchClose}
          <tool-tip inert arrow tip-position="top" role="tooltip">
            <span class="code">Esc</span> to clear all
          </tool-tip>
        </div>
      </label>
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
    const classList = classMap({
      'show-toolbar': this.showSearch,
      'affine-database-toolbar': true,
    });
    return html` <div class="${classList}">
      ${filter} ${searchTool} ${expandIcon}
      ${this.readonly
        ? null
        : html` <div
              class="affine-database-toolbar-item more-action"
              @click="${this._clickMoreAction}"
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
