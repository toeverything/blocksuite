// related component
import './components/column-header/column-header.js';
import './components/column-header/column-width-drag-bar.js';
import './components/cell-container.js';
import './components/toolbar/toolbar.js';
import './components/database-title.js';

import { PlusIcon } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import { asyncFocusRichText } from '../../__internal__/index.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import { columnManager, multiSelectHelper } from '../common/column-manager.js';
import type {
  DatabaseViewDataMap,
  TableMixColumn,
  TableViewData,
} from '../common/view-manager.js';
import type {
  ColumnDataUpdater,
  DatabaseBlockModel,
  InsertPosition,
} from '../database-model.js';
import { evalFilter } from '../logical/eval-filter.js';
import { isText, onClickOutside } from '../utils.js';
import type { DatabaseColumnHeader } from './components/column-header/column-header.js';
import { registerInternalRenderer } from './components/column-type/index.js';
import { changeColumnType } from './components/edit-column-popup/utils.js';
import { DataBaseRowContainer } from './components/row-container.js';
import { CellSelectionManager } from './selection-manager/cell.js';
import { RowSelectionManager } from './selection-manager/row.js';
import type { ColumnManager, TableViewManager } from './table-view-manager.js';
import { DatabaseTableViewManager } from './table-view-manager.js';
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
    const titleColumn: TableMixColumn = {
      id: 'title',
      width: this.model.titleColumnWidth,
      name: this.model.titleColumnName,
      type: 'title',
      data: {},
      updateWidth: (width: number) => {
        this.model.page.captureSync();
        this.model.page.updateBlock(this.model, {
          titleColumnWidth: width,
        });
      },
      updateName: (name: string) => {
        this.model.page.captureSync();
        this.model.page.updateBlock(this.model, {
          titleColumnName: name,
        });
      },
      updateHide: (hide: boolean) => {
        //TODO
      },
      updateData: (update: ColumnDataUpdater) => {
        //Do Nothing
      },
    };

    return [
      titleColumn,
      ...this.view.columns.map(v => {
        const columnIndex = this.model.columns.findIndex(c => c.id === v.id);
        const column = this.model.columns[columnIndex];
        assertExists(column);
        return {
          ...v,
          ...column,
          updateData: (update: ColumnDataUpdater) => {
            this.model.page.captureSync();
            this.model.updateColumnData(v.id, update);
          },
          updateHide: (hide: boolean) => {
            //TODO
          },
          updateName: (name: string) => {
            this.model.page.captureSync();
            this.model.updateColumn({
              ...column,
              name,
            });
            this.model.applyColumnUpdate();
          },
          updateWidth: (width: number) => {
            this.model.page.captureSync();
            this.model.updateView(this.view.id, 'table', data => {
              data.columns.forEach(v => {
                if (v.id === column.id) {
                  v.width = width;
                }
              });
            });
            this.model.applyViewsUpdate();
          },
          updateType: (type: string) => {
            changeColumnType(this.model, column, type);
          },
          delete: () => {
            this.model.page.captureSync();
            this.model.deleteColumn(v.id);
            this.model.deleteCellsByColumn(v.id);
            this.model.applyColumnUpdate();
          },
          duplicate: () => {
            this.model.page.captureSync();
            const currentSchema = this.model.getColumn(v.id);
            assertExists(currentSchema);
            const { id: copyId, ...nonIdProps } = currentSchema;
            const schema = { ...nonIdProps };
            const id = this.model.addColumnAfter(v.id, schema);
            this.model.applyColumnUpdate();
            this.model.copyCellsByColumn(copyId, id);
          },
        } as TableMixColumn;
      }),
    ];
  };

  _viewData = (columns: TableMixColumn[]): TableViewData => {
    const moveColumn = (id: string, toAfterOfColumn?: InsertPosition) => {
      const columnIndex = columns.findIndex(v => v.id === id);
      this.model.page.captureSync();
      this.model.updateView(this.view.id, 'table', view => {
        const [column] = view.columns.splice(columnIndex, 1);
        const targetColumnIndex = toAfterOfColumn
          ? view.columns.findIndex(v => v.id === toAfterOfColumn)
          : 0;
        view.columns.splice(targetColumnIndex + 1, 0, column);
      });
      this.model.applyColumnUpdate();
    };
    return {
      ...this.view,
      moveColumn,
      preColumn(id: string): TableMixColumn | undefined {
        return columns[columns.findIndex(v => v.id === id) - 1];
      },
      nextColumn(id: string): TableMixColumn | undefined {
        return columns[columns.findIndex(v => v.id === id) + 1];
      },
      newColumn: (position?: InsertPosition) => {
        // columns.filter(v=>v.name.startsWith(multiSelectHelper))
        this.model.page.captureSync();
        const id = this.model.addColumnAfter(
          position,
          multiSelectHelper.create(`Column ${columns.length + 1}`)
        );
        this.model.applyColumnUpdate();

        requestAnimationFrame(() => {
          this._columnHeaderComponent.setEditingColumnId(id);
        });
      },
    };
  };

  private _searchFilter = (rowMap: Record<string, unknown>) => {
    if (!this._searchString) {
      return true;
    }
    const columns = this._mixColumns();
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
    const allRow = Object.values(this.model.cells[rowTitle.id] ?? {}).map(v => [
      v.columnId,
      isText(v.value) ? v.value.toString() : v.value,
    ]);
    allRow.push([this.model.id, rowTitle.text?.yText.toString()]);
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

  private _tableViewManager(columns: TableMixColumn[]): TableViewManager {
    return new DatabaseTableViewManager({ view: this.view, columns });
  }

  private _addRow = (index?: number, rows: BaseBlockModel[]) => {
    if (this.readonly) return;

    const currentSearchState = this._searchState;
    this._resetSearchState();
    this._resetHoverState();

    const page = this.model.page;
    page.captureSync();
    // if (index !== 0 && index != null) {
    //   this;
    //   index = this.model.children.indexOf();
    // }

    // this.model.children;
    const id = page.addBlock('affine:paragraph', {}, this.model.id, index);
    asyncFocusRichText(page, id);
    // save the search state
    this._setSearchState(currentSearchState);
  };

  private _addColumn = (index: number) => {
    if (this.readonly) return;

    // this.model.page.captureSync();
    // const currentColumns = this.model.columns;
    // const id = this.model.addColumn(
    //   multiSelectHelper.create(`Column ${currentColumns.length + 1}`),
    //   index,
    // );
    // this.model.applyColumnUpdate();
    //
    // requestAnimationFrame(() => {
    //   this._columnHeaderComponent.setEditingColumnId(id);
    // });
  };

  private _renderRows = () => {
    return this.model.children.filter((_, i) => this._filter(i));
  };

  private _renderColumnWidthDragBar = (columns: ColumnManager[]) => {
    let left = 0;
    return repeat(
      columns,
      v => v.id,
      column => {
        left += column.width;
        return html`<affine-database-column-width-drag-bar
          .left=${left}
          .column=${column}
        ></affine-database-column-width-drag-bar>`;
      }
    );
  };

  override render() {
    const mixColumns = this._mixColumns();
    const rows = this._renderRows();
    const rowsTemplate = DataBaseRowContainer(
      this,
      mixColumns,
      rows,
      this._searchState,
      this.root
    );
    const addRow = (index?: number) => {
      this._addRow(index, rows);
    };
    const viewData = this._viewData(mixColumns);
    const tableViewManager = this._tableViewManager(mixColumns);
    return html`
      <div class="affine-database-table">
        <div class="affine-database-block-title-container">
          <affine-database-title
            .addRow="${addRow}"
            .targetModel="${this.model}"
          ></affine-database-title>
          <affine-database-toolbar
            .columns="${mixColumns}"
            .view="${viewData}"
            .addRow="${addRow}"
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
              .tableViewManager=${tableViewManager}
              .view="${viewData}"
              .columns="${mixColumns}"
              .targetModel="${this.model}"
              .addColumn="${this._addColumn}"
              .columnRenderer="${this.columnRenderer}"
            ></affine-database-column-header>
            ${rowsTemplate}
            ${this._renderColumnWidthDragBar(tableViewManager.columns)}
          </div>
        </div>
        ${this.readonly
          ? null
          : html` <div class="affine-database-block-footer">
              <div
                class="affine-database-block-add-row"
                data-test-id="affine-database-add-row-button"
                role="button"
                @click="${addRow}"
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
