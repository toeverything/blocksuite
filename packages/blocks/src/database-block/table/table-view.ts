// related component
import './components/column-header/column-header.js';
import './components/column-header/column-width-drag-bar.js';
import './components/cell-container.js';
import './components/selection.js';

import type { WheelEvent } from 'happy-dom';
import { css, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { TableViewSelection } from '../../__internal__/index.js';
import { positionToVRect } from '../../components/menu/index.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import { renderUniLit } from '../../components/uni-component/uni-component.js';
import {
  MoreHorizontalIcon,
  NewEditIcon,
  PlusIcon,
} from '../../icons/index.js';
import { BaseDataView } from '../common/base-data-view.js';
import type { InsertPosition } from '../types.js';
import { insertPositionToIndex } from '../utils/insert.js';
import { TableViewClipboard } from './clipboard.js';
import { openDetail, popRowMenu } from './components/menu.js';
import type { DatabaseSelectionView } from './components/selection.js';
import { DEFAULT_COLUMN_MIN_WIDTH } from './consts.js';
import type { DataViewTableManager } from './table-view-manager.js';

const styles = css`
  affine-database-table {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  affine-database-table * {
    box-sizing: border-box;
  }
  .affine-database-table {
    overflow-y: auto;
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

  @query('affine-database-selection')
  public selection!: DatabaseSelectionView;

  private get readonly() {
    return this.view.readonly;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.add(
      this.view.slots.update.on(() => {
        this.requestUpdate();
      })
    );

    // init clipboard
    const clipboard = new TableViewClipboard({
      view: this,
      data: this.view,
      disposables: this._disposables,
    });
    clipboard.init();

    if (this.readonly) return;
  }

  public override addRow(position: InsertPosition) {
    this._addRow(this.view, position);
  }

  private _addRow = (
    tableViewManager: DataViewTableManager,
    position: InsertPosition | number
  ) => {
    if (this.readonly) return;

    const index =
      typeof position === 'number'
        ? position
        : insertPositionToIndex(
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

  private renderRow(rowId: string, rowIndex: number) {
    const view = this.view;
    const contextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const ele = e.target as HTMLElement;
      const columnIndex =
        ele.closest('affine-database-cell-container')?.columnIndex ?? 0;
      this.selection.selection = {
        rowsSelection: {
          start: rowIndex,
          end: rowIndex,
        },
        focus: {
          rowIndex: rowIndex,
          columnIndex: columnIndex,
        },
        isEditing: false,
      };
      popRowMenu(positionToVRect(e.x, e.y), rowId, this.selection);
    };
    return html`
      <div
        class="affine-database-block-row database-row"
        data-row-index="${rowIndex}"
        data-row-id="${rowId}"
        @contextmenu="${contextMenu}"
      >
        ${repeat(
          view.columnManagerList,
          v => v.id,
          (column, i) => {
            const clickDetail = () => {
              this.selection.selection = {
                rowsSelection: {
                  start: rowIndex,
                  end: rowIndex,
                },
                focus: {
                  rowIndex: rowIndex,
                  columnIndex: i,
                },
                isEditing: false,
              };
              openDetail(rowId, this.selection);
            };
            const openMenu = (e: MouseEvent) => {
              const ele = e.currentTarget as HTMLElement;
              this.selection.selection = {
                rowsSelection: {
                  start: rowIndex,
                  end: rowIndex,
                },
                focus: {
                  rowIndex: rowIndex,
                  columnIndex: i,
                },
                isEditing: false,
              };
              popRowMenu(ele, rowId, this.selection);
            };
            return html`
              <div>
                <affine-database-cell-container
                  class="database-cell"
                  style=${styleMap({
                    width: `${column.width}px`,
                    border: i === 0 ? 'none' : undefined,
                  })}
                  .view="${view}"
                  .column="${column}"
                  .rowId="${rowId}"
                  data-row-id="${rowId}"
                  .rowIndex="${rowIndex}"
                  data-row-index="${rowIndex}"
                  .columnId="${column.id}"
                  data-column-id="${column.id}"
                  .columnIndex="${i}"
                  data-column-index="${i}"
                >
                </affine-database-cell-container>
              </div>
              ${column.dataViewManager.header.titleColumn === column.id
                ? html`<div class="row-ops">
                    <div class="row-op" @click="${clickDetail}">
                      ${NewEditIcon}
                    </div>
                    ${!view.readonly
                      ? html`<div class="row-op" @click="${openMenu}">
                          ${MoreHorizontalIcon}
                        </div>`
                      : nothing}
                  </div>`
                : nothing}
            `;
          }
        )}
        <div class="database-cell add-column-button"></div>
      </div>
    `;
  }

  private renderTable() {
    const view = this.view;
    return html`
      <style>
        .affine-database-block-rows {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
        }

        .affine-database-block-row {
          width: 100%;
          display: flex;
          flex-direction: row;
          border-bottom: 1px solid var(--affine-border-color);
          position: relative;
        }

        .affine-database-block-row.selected > .database-cell {
          background: transparent;
        }

        .database-cell {
          min-width: ${DEFAULT_COLUMN_MIN_WIDTH}px;
        }

        .row-ops {
          position: relative;
          width: 0;
          margin-top: 8px;
          height: max-content;
          visibility: hidden;
          display: flex;
          gap: 4px;
          cursor: pointer;
          justify-content: end;
        }

        .row-op:last-child {
          margin-right: 8px;
        }

        .affine-database-block-row:hover .row-ops {
          visibility: visible;
        }

        .row-op {
          display: flex;
          padding: 4px;
          border-radius: 4px;
          box-shadow: 0px 0px 4px 0px rgba(66, 65, 73, 0.14);
          background-color: var(--affine-background-primary-color);
          position: relative;
        }

        .row-op:hover:before {
          content: '';
          border-radius: 4px;
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background-color: var(--affine-hover-color);
        }

        .row-op svg {
          fill: var(--affine-icon-color);
          color: var(--affine-icon-color);
          width: 16px;
          height: 16px;
        }

        /*.database-cell:last-child affine-database-cell-container {*/
        /*  border-right: none;*/
        /*}*/
      </style>
      <div class="affine-database-block-rows">
        ${repeat(
          view.rows,
          id => id,
          (id, idx) => {
            return this.renderRow(id, idx);
          }
        )}
      </div>
    `;
  }
  onWheel = (event: WheelEvent) => {
    const ele = event.currentTarget;
    if (ele instanceof HTMLElement) {
      if (ele.scrollWidth === ele.clientWidth) {
        return;
      }
      event.stopPropagation();
    }
  };
  override render() {
    const addRow = (position: InsertPosition) => {
      this._addRow(this.view, position);
    };

    return html`
      ${renderUniLit(this.header, { view: this.view, viewMethods: this })}
      <div class="affine-database-table">
        <div class="affine-database-block-table" @wheel="${this.onWheel}">
          <div class="affine-database-table-container">
            <affine-database-column-header
              .tableViewManager="${this.view}"
            ></affine-database-column-header>
            ${this.renderTable()} ${this._renderColumnWidthDragBar()}
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

  focusFirstCell(): void {
    this.selection.focusFirstCell();
  }

  getSelection = () => {
    return this.selection.selection;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-table': DatabaseTable;
  }
}
