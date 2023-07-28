// related component
import './components/column-header/column-header.js';
import './components/column-header/column-width-drag-bar.js';
import './components/cell-container.js';
import './components/toolbar/toolbar.js';
import './components/database-title.js';
import './components/selection.js';

import { PlusIcon } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import { css } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html } from 'lit/static-html.js';

import type { TableViewSelection } from '../../__internal__/index.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import { BaseDataView } from '../common/base-data-view.js';
import type { InsertPosition } from '../types.js';
import { insertPositionToIndex } from '../utils/insert.js';
import type { DatabaseColumnHeader } from './components/column-header/column-header.js';
import { DataBaseRowContainer } from './components/row-container.js';
import type { DatabaseSelectionView } from './components/selection.js';
import type { DataViewTableManager } from './table-view-manager.js';

const styles = css`
  affine-database-table {
    position: relative;
    margin-top: 32px;
  }

  affine-database-table * {
    box-sizing: border-box;
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

  @media print {
    .affine-database-block-footer {
      display: none;
    }
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

  .database-cell {
    border-left: 1px solid var(--affine-border-color);
  }

  ${tooltipStyle}
`;

@customElement('affine-database-table')
export class DatabaseTable extends BaseDataView<
  DataViewTableManager,
  TableViewSelection
> {
  static override styles = styles;

  @query('.affine-database-table-container')
  private _tableContainer!: HTMLDivElement;

  @query('affine-database-column-header')
  private _columnHeaderComponent!: DatabaseColumnHeader;

  @query('affine-database-selection')
  public selection!: DatabaseSelectionView;

  private get readonly() {
    return this.view.readonly;
  }

  override firstUpdated() {
    this._disposables.add(
      this.view.slots.update.on(() => {
        this.requestUpdate();
      })
    );

    if (this.readonly) return;
    const tableContent = this._tableContainer.parentElement;
    assertExists(tableContent);
    this._disposables.addFromEvent(
      tableContent,
      'scroll',
      this._onDatabaseScroll
    );
  }

  private _onDatabaseScroll = (event: Event) => {
    this._columnHeaderComponent.showAddColumnButton();
  };

  private _addRow = (
    tableViewManager: DataViewTableManager,
    position: InsertPosition
  ) => {
    if (this.readonly) return;
    const index = insertPositionToIndex(
      position,
      this.view.rows.map(id => ({ id }))
    );
    tableViewManager.rowAdd(position);
    requestAnimationFrame(() => {
      this.selection.selection = {
        focus: {
          rowIndex: index,
          columnIndex: 0,
        },
        isEditing: true,
      };
    });
  };

  private _renderColumnWidthDragBar = () => {
    let left = 0;
    return repeat(
      this.view.columnManagerList,
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
    const rowsTemplate = DataBaseRowContainer(this.view);
    const addRow = (position: InsertPosition) => {
      this._addRow(this.view, position);
    };
    return html`
      <div class="affine-database-table">
        <div class="affine-database-block-title-container">
          <affine-database-title
            .titleText="${this.titleText}"
            .addRow="${() => addRow('start')}"
            .readonly="${this.readonly}"
          ></affine-database-title>
          <affine-database-toolbar
            .tableView="${this}"
            .copyBlock="${this.blockOperation.copy}"
            .deleteSelf="${this.blockOperation.delete}"
            .view="${this.view}"
            .addRow="${addRow}"
          ></affine-database-toolbar>
        </div>
        <div class="affine-database-block-table">
          <div class="affine-database-table-container">
            <affine-database-column-header
              .tableViewManager="${this.view}"
            ></affine-database-column-header>
            ${rowsTemplate} ${this._renderColumnWidthDragBar()}
            <affine-database-selection
              .tableView="${this}"
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
