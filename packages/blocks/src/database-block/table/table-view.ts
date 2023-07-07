// related component
import './components/column-header/column-header.js';
import './components/column-header/column-width-drag-bar.js';
import './components/cell-container.js';
import './components/toolbar/toolbar.js';
import './components/database-title.js';
import './components/selection/selection.js';

import { PlusIcon } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import { asyncFocusRichText } from '../../__internal__/index.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import type { DatabaseViewDataMap } from '../common/view-manager.js';
import type { DatabaseBlockModel, InsertPosition } from '../database-model.js';
import { onClickOutside } from '../utils/utils.js';
import type { DatabaseColumnHeader } from './components/column-header/column-header.js';
import { DataBaseRowContainer } from './components/row-container.js';
import type { DatabaseSelectionView } from './components/selection/selection.js';
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
    z-index: 1;
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
    background-color: transparent;
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
    position: relative;
    margin-top: -8px;
    z-index: 0;
    background-color: var(--affine-hover-color-filled);
    opacity: 0;
  }

  .affine-database-block-footer:hover {
    opacity: 1;
  }

  .affine-database-block-add-row {
    display: flex;
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

  @property({ attribute: false })
  model!: DatabaseBlockModel;

  @property({ attribute: false })
  view!: DatabaseViewDataMap['table'];

  @property({ attribute: false })
  root!: BlockSuiteRoot;

  @property({ attribute: false })
  modalMode?: boolean;

  @query('.affine-database-table-container')
  private _tableContainer!: HTMLDivElement;

  @query('affine-database-column-header')
  private _columnHeaderComponent!: DatabaseColumnHeader;

  @query('affine-database-selection')
  public selection!: DatabaseSelectionView;

  @state()
  private _searchState: SearchState = SearchState.SearchIcon;

  @state()
  private _searchString = '';

  @state()
  private _hoverState = false;

  private get readonly() {
    return this.model.page.readonly;
  }

  override connectedCallback() {
    super.connectedCallback();

    this._updateHoverState();

    const disposables = this._disposables;
    disposables.addFromEvent(this, 'mouseover', this._onMouseOver);
    disposables.addFromEvent(this, 'mouseleave', this._onMouseLeave);
    disposables.addFromEvent(this, 'click', this._onClick);
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
  }

  private _setSearchState = (state: SearchState) => {
    this._searchState = state;
  };
  private _setSearchString = (search: string) => {
    this._searchString = search;
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

  private _tableViewManager(): TableViewManager {
    return new DatabaseTableViewManager(
      this.model,
      this.view,
      this.root,
      this._searchString
    );
  }

  private _addRow = (
    tableViewManager: TableViewManager,
    position: InsertPosition
  ) => {
    if (this.readonly) return;

    const currentSearchState = this._searchState;
    this._resetSearchState();
    this._resetHoverState();

    const page = this.model.page;
    page.captureSync();
    const id = tableViewManager.addRow(position);
    asyncFocusRichText(page, id);
    // save the search state
    this._setSearchState(currentSearchState);
  };

  private _renderColumnWidthDragBar = (columns: ColumnManager[]) => {
    let left = 0;
    return repeat(
      columns,
      v => v.id,
      column => {
        left += column.width;
        return html` <affine-database-column-width-drag-bar
          .left="${left}"
          .column="${column}"
        ></affine-database-column-width-drag-bar>`;
      }
    );
  };

  override render() {
    const tableViewManager = this._tableViewManager();
    const rowsTemplate = DataBaseRowContainer(tableViewManager);
    const addRow = (position: InsertPosition) => {
      this._addRow(tableViewManager, position);
    };
    return html`
      <div class="affine-database-table">
        <div class="affine-database-block-title-container">
          <affine-database-title
            .addRow="${() => addRow('start')}"
            .targetModel="${this.model}"
          ></affine-database-title>
          <affine-database-toolbar
            .root=${this.root}
            .modalMode=${this.modalMode}
            .view="${tableViewManager}"
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
              .tableViewManager="${tableViewManager}"
              .targetModel="${this.model}"
            ></affine-database-column-header>
            ${rowsTemplate}
            ${this._renderColumnWidthDragBar(tableViewManager.columns)}
            <affine-database-selection
              .databaseId="${this.model.id}"
              .eventDispatcher="${this.root.uiEventDispatcher}"
              .view="${tableViewManager}"
            ></affine-database-selection>
          </div>
        </div>
        ${this.readonly
          ? null
          : html` <div class="affine-database-block-footer">
              <div
                class="affine-database-block-add-row"
                data-test-id="affine-database-add-row-button"
                role="button"
                @click="${() => addRow('end')}"
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

export const getTableContainer = (ele: HTMLElement) => {
  const element = ele.closest(
    '.affine-database-table-container'
  ) as HTMLElement;
  assertExists(element);
  return element;
};
