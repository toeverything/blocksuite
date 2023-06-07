// related component
import './components/column-header/column-header.js';
import './components/cell-container.js';
import './components/toolbar/toolbar.js';
import './components/database-title.js';

import { PlusIcon } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { html } from 'lit/static-html.js';

import { asyncFocusRichText } from '../../__internal__/index.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import { evalFilter } from '../common/ast.js';
import {
  columnManager,
  multiSelectHelper,
  richTextHelper,
} from '../common/column-manager.js';
import type {
  DatabaseViewDataMap,
  TableMixColumn,
} from '../common/view-manager.js';
import type { DatabaseBlockModel } from '../database-model.js';
import { onClickOutside } from '../utils.js';
import type { DatabaseColumnHeader } from './components/column-header/column-header.js';
import { registerInternalRenderer } from './components/column-type/index.js';
import { DataBaseRowContainer } from './components/row-container.js';
import { CellSelectionManager } from './selection-manager/cell.js';
import { RowSelectionManager } from './selection-manager/row.js';
import { SearchState } from './types.js';

const styles = css`
  affine-database-table {
    position: relative;
  }

  .affine-database-block-title-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    margin: 2px 0 2px;
  }

  .affine-database-block-table {
    position: relative;
    width: 100%;
    padding-bottom: 4px;
    overflow-x: scroll;
    overflow-y: hidden;
    border-top: 1.5px solid var(--affine-border-color);
  }

  .affine-database-block-table:hover {
    padding-bottom: 0px;
  }
  .affine-database-block-table::-webkit-scrollbar {
    -webkit-appearance: none;
    display: block;
  }

  .affine-database-block-table::-webkit-scrollbar:horizontal {
    height: 4px;
  }

  .affine-database-block-table::-webkit-scrollbar-thumb {
    border-radius: 2px;
    background-color: var(--affine-black-10);
  }
  .affine-database-block-table:hover::-webkit-scrollbar:horizontal {
    height: 8px;
  }

  .affine-database-block-table:hover::-webkit-scrollbar-thumb {
    border-radius: 16px;
    background-color: var(--affine-black-30);
  }
  .affine-database-block-table:hover::-webkit-scrollbar-track {
    background-color: var(--affine-hover-color);
  }

  .affine-database-table-container {
    position: relative;
    width: fit-content;
    min-width: 100%;
  }

  .affine-database-block-tag-circle {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
  }

  .affine-database-block-tag {
    display: inline-flex;
    border-radius: 11px;
    align-items: center;
    padding: 0 8px;
    cursor: pointer;
  }

  .affine-database-block-footer {
    display: flex;
    width: 100%;
    height: 28px;
    margin-top: -8px;
  }

  .affine-database-block-footer:hover {
    position: relative;
    z-index: 1;
    background-color: var(--affine-hover-color-filled);
  }

  .affine-database-block-footer:hover .affine-database-block-add-row {
    display: flex;
  }

  .affine-database-block-add-row {
    display: none;
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    height: 100%;
    cursor: pointer;
    user-select: none;
    font-size: 14px;
  }

  .affine-database-block-add-row svg {
    width: 16px;
    height: 16px;
  }

  ${tooltipStyle}
`;

@customElement('affine-database-table')
export class DatabaseTable extends WithDisposable(ShadowlessElement) {
  flavour = 'affine:database' as const;

  static override styles = styles;

  @property()
  model!: DatabaseBlockModel;

  @property()
  view!: DatabaseViewDataMap['table'];

  @property()
  root!: BlockSuiteRoot;

  @query('.affine-database-table-container')
  private _tableContainer!: HTMLDivElement;

  @query('affine-database-column-header')
  private _columnHeaderComponent!: DatabaseColumnHeader;

  @state()
  private _searchState: SearchState = SearchState.SearchIcon;

  @state()
  private _searchString = '';

  @state()
  private _hoverState = false;

  private _rowSelection!: RowSelectionManager;
  private _cellSelection!: CellSelectionManager;

  private _columnRenderer = registerInternalRenderer();
  get columnRenderer() {
    return this._columnRenderer;
  }

  private get readonly() {
    return this.model.page.readonly;
  }

  override connectedCallback() {
    super.connectedCallback();

    this._updateHoverState();
    this._initRowSelectionEvents();
    this._initCellSelectionEvents();

    const disposables = this._disposables;
    disposables.addFromEvent(this, 'mouseover', this._onMouseOver);
    disposables.addFromEvent(this, 'mouseleave', this._onMouseLeave);
    disposables.addFromEvent(this, 'click', this._onClick);
    disposables.addFromEvent(
      this,
      'keydown',
      this._cellSelection.onCellSelectionChange
    );
  }

  override firstUpdated() {
    this.model.propsUpdated.on(() => {
      this.requestUpdate();
      // TODO: optimize performance here
      this.querySelectorAll('affine-database-cell-container').forEach(cell => {
        cell.requestUpdate();
      });
      this.querySelector('affine-database-column-header')?.requestUpdate();
    });
    this.model.childrenUpdated.on(() => {
      this.requestUpdate();
      // TODO: optimize performance here
      this.querySelectorAll('affine-database-cell-container').forEach(cell => {
        cell.requestUpdate();
      });
      this.querySelector('affine-database-column-header')?.requestUpdate();
      this._updateHoverState();
    });

    if (this.readonly) return;
    const tableContent = this._tableContainer.parentElement;
    assertExists(tableContent);
    this._disposables.addFromEvent(
      tableContent,
      'scroll',
      this._onDatabaseScroll
    );
  }

  private _updateHoverState() {
    if (this.model.children.length === 0) {
      this._hoverState = true;
      return;
    }

    this._resetHoverState();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this._rowSelection.dispose();
    this._cellSelection.dispose();
  }

  private _initRowSelectionEvents = () => {
    this._rowSelection = new RowSelectionManager(
      this.root.uiEventDispatcher,
      this.model
    );
  };

  private _initCellSelectionEvents = () => {
    this._cellSelection = new CellSelectionManager(
      this.root.uiEventDispatcher,
      this.model
    );
  };

  private _setSearchState = (state: SearchState) => {
    this._searchState = state;
  };
  private _setSearchString = (search: string) => {
    this._searchString = search;
  };

  private _mixColumns = (): TableMixColumn[] => {
    return this.view.columns.map(v => {
      return {
        ...v,
        ...this.model.columns.find(c => c.id === v.id),
      } as TableMixColumn;
    });
  };

  private _columnsWithTitle = (): {
    id: string;
    data: unknown;
    type: string;
  }[] => {
    return [
      { id: this.model.id, data: {}, type: richTextHelper.type },
      ...this._mixColumns(),
    ];
  };

  private _searchFilter = (rowMap: Record<string, unknown>) => {
    if (!this._searchString) {
      return true;
    }
    const columns = this._columnsWithTitle();
    for (const column of columns) {
      const str =
        columnManager.toString(column.type, rowMap[column.id], column.data) ??
        '';
      if (str.indexOf(this._searchString) >= 0) {
        return true;
      }
    }
    return false;
  };

  private _filter = (index: number): boolean => {
    const rowTitle = this.model.children[index];
    const allRow = Object.values(this.model.cells[rowTitle.id]).map(v => [
      v.columnId,
      v.value,
    ]);
    allRow.push([this.model.id, rowTitle.text?.yText]);
    const rowMap = Object.fromEntries(allRow);
    if (!this._searchFilter(rowMap)) {
      return false;
    }
    if (!evalFilter(this.view.filter, rowMap)) {
      return false;
    }
    return true;
  };

  private _resetSearchState() {
    this._searchState = SearchState.SearchIcon;
  }

  private _resetHoverState() {
    this._hoverState = false;
  }

  private _onDatabaseScroll = (event: Event) => {
    this._columnHeaderComponent.showAddColumnButton();
  };

  private _onMouseOver = () => {
    this._hoverState = true;
  };

  private _onMouseLeave = () => {
    if (this._searchState === SearchState.SearchIcon) {
      this._updateHoverState();
    }
  };

  private _onClick = () => {
    setTimeout(() => {
      onClickOutside(
        this,
        () => {
          if (this._searchState !== SearchState.Searching) {
            this._resetHoverState();
            this._resetSearchState();
          }
        },
        'mousedown'
      );
    });
  };

  private _addRow = (index?: number) => {
    if (this.readonly) return;

    const currentSearchState = this._searchState;
    this._resetSearchState();
    this._resetHoverState();

    const page = this.model.page;
    page.captureSync();
    const id = page.addBlock('affine:paragraph', {}, this.model.id, index);
    asyncFocusRichText(page, id);
    // save the search state
    this._setSearchState(currentSearchState);
  };

  private _addColumn = (index: number) => {
    if (this.readonly) return;

    this.model.page.captureSync();
    const currentColumns = this.model.columns;
    const id = this.model.addColumn(
      multiSelectHelper.create(`Column ${currentColumns.length + 1}`),
      index
    );
    this.model.applyColumnUpdate();

    requestAnimationFrame(() => {
      this._columnHeaderComponent.setEditingColumnId(id);
    });
  };

  override render() {
    const mixColumns = this._mixColumns();
    const rows = DataBaseRowContainer(
      this,
      mixColumns,
      this._filter,
      this._searchState,
      this.root
    );
    return html`
      <div class="affine-database-table">
        <div class="affine-database-block-title-container">
          <affine-database-title
            .addRow="${this._addRow}"
            .targetModel="${this.model}"
          ></affine-database-title>
          <affine-database-toolbar
            .columns="${mixColumns}"
            .view="${this.view}"
            .addRow="${this._addRow}"
            .targetModel="${this.model}"
            .hoverState="${this._hoverState}"
            .searchState="${this._searchState}"
            .setSearchState="${this._setSearchState}"
            .setSearchString="${this._setSearchString}"
          ></affine-database-toolbar>
        </div>
        <div class="affine-database-block-table">
          <div class="affine-database-table-container">
            <affine-database-column-header
              .view="${this.view}"
              .columns="${mixColumns}"
              .targetModel="${this.model}"
              .addColumn="${this._addColumn}"
              .columnRenderer="${this.columnRenderer}"
            ></affine-database-column-header>
            ${rows}
          </div>
        </div>
        ${this.readonly
          ? null
          : html` <div class="affine-database-block-footer">
              <div
                class="affine-database-block-add-row"
                data-test-id="affine-database-add-row-button"
                role="button"
                @click="${() => this._addRow()}"
              >
                ${PlusIcon}<span>New Record</span>
              </div>
            </div>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-table': DatabaseTable;
  }
}
