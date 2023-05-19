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
import { getService } from '../../__internal__/service.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import type { DatabaseBlockModel } from '../database-model.js';
import { onClickOutside } from '../utils.js';
import type { DatabaseColumnHeader } from './components/column-header/column-header.js';
import { registerInternalRenderer } from './components/column-type/index.js';
import { DataBaseRowContainer } from './components/row-container.js';
import { DEFAULT_COLUMN_WIDTH } from './consts.js';
import type { Column } from './types.js';
import { SearchState } from './types.js';

const KEYS_WHITE_LIST = [
  'Tab',
  'Enter',
  'Escape',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
];

const styles = css`
  affine-database-table {
    position: relative;
  }

  .affine-database-block-title-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    margin: 18px 0 0;
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
  root!: BlockSuiteRoot;

  @query('.affine-database-table-container')
  private _tableContainer!: HTMLDivElement;

  @query('affine-database-column-header')
  private _columnHeaderComponent!: DatabaseColumnHeader;

  @state()
  private _searchState: SearchState = SearchState.SearchIcon;

  @state()
  private _filteredRowIds: string[] = [];

  @state()
  private _hoverState = false;

  private _columnRenderer = registerInternalRenderer();
  get columnRenderer() {
    return this._columnRenderer;
  }

  private get columns(): Column[] {
    return this.model.columns;
  }

  private get readonly() {
    return this.model.page.readonly;
  }

  override connectedCallback() {
    super.connectedCallback();

    const disposables = this._disposables;
    disposables.addFromEvent(this, 'mouseover', this._onMouseOver);
    disposables.addFromEvent(this, 'mouseleave', this._onMouseLeave);
    disposables.addFromEvent(this, 'click', this._onClick);
    disposables.addFromEvent(this, 'keydown', this._onCellSelectionChange);
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

  private _setFilteredRowIds = (rowIds: string[]) => {
    this._filteredRowIds = rowIds;
  };

  private _setSearchState = (state: SearchState) => {
    this._searchState = state;
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
      this._resetHoverState();
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

  private _onCellSelectionChange = (event: KeyboardEvent) => {
    if (KEYS_WHITE_LIST.indexOf(event.key) <= -1) return;

    const target = event.target as HTMLElement;
    const rowsContainer = target.closest('.affine-database-block-rows');
    const currentCell = target.closest('.database-cell');
    if (!rowsContainer) return;
    if (!currentCell) return;
    event.preventDefault();

    const service = getService('affine:database');
    service.slots.tableViewCellSelectionUpdated.emit({
      type: 'select',
      key: event.key,
      cell: currentCell,
      databaseId: this.model.id,
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
    const defaultColumnType = 'multi-select';
    const renderer = this._columnRenderer.get(defaultColumnType);
    const schema: Omit<Column, 'id'> = {
      type: defaultColumnType,
      name: `Column ${currentColumns.length + 1}`,
      width: DEFAULT_COLUMN_WIDTH,
      hide: false,
      ...renderer.propertyCreator(),
    };
    const id = this.model.addColumn(schema, index);
    this.model.applyColumnUpdate();

    requestAnimationFrame(() => {
      this._columnHeaderComponent.setEditingColumnId(id);
    });
  };

  override render() {
    const rows = DataBaseRowContainer(
      this,
      this._filteredRowIds,
      this._searchState,
      this.root
    );

    return html`
      <div class="affine-database-table">
        <div class="affine-database-block-title-container">
          <affine-database-title
            .addRow=${this._addRow}
            .targetModel=${this.model}
          ></affine-database-title>
          <affine-database-toolbar
            .addRow=${this._addRow}
            .targetModel=${this.model}
            .hoverState=${this._hoverState}
            .searchState=${this._searchState}
            .setSearchState=${this._setSearchState}
            .setFilteredRowIds=${this._setFilteredRowIds}
          ></affine-database-toolbar>
        </div>
        <div class="affine-database-block-table">
          <div class="affine-database-table-container">
            <affine-database-column-header
              .columns=${this.columns}
              .targetModel=${this.model}
              .addColumn=${this._addColumn}
              .columnRenderer=${this.columnRenderer}
            ></affine-database-column-header>
            ${rows}
          </div>
        </div>
        ${this.readonly
          ? null
          : html`<div class="affine-database-block-footer">
              <div
                class="affine-database-block-add-row"
                data-test-id="affine-database-add-row-button"
                role="button"
                @click=${() => this._addRow()}
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
