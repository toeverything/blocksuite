import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';

import type {
  CellFocus,
  MultiSelection,
  TableViewSelection,
} from '../../../__internal__/utils/types.js';
import { startDrag } from '../../utils/drag.js';
import type { DatabaseTable } from '../table-view.js';
import type { DatabaseCellContainer } from './cell-container.js';

@customElement('affine-database-selection')
export class DatabaseSelectionView extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .database-selection {
      position: absolute;
      z-index: 1;
      box-sizing: border-box;
      background: var(--affine-primary-color-04);
      pointer-events: none;
      display: none;
    }

    .database-focus {
      position: absolute;
      width: 100%;
      z-index: 1;
      box-sizing: border-box;
      border: 2px solid var(--affine-primary-color) !important;
      border-radius: 2px;
      pointer-events: none;
      display: none;
      outline: none;
    }

    @media print {
      affine-database-selection {
        display: none;
      }
    }
  `;

  @property({ attribute: false })
  tableView!: DatabaseTable;

  private _databaseSelection?: TableViewSelection;
  private focusRef = createRef<HTMLDivElement>();
  private selectionRef = createRef<HTMLDivElement>();

  get tableContainer() {
    const tableContainer = this.parentElement;
    assertExists(tableContainer);
    return tableContainer;
  }

  override firstUpdated() {
    this.bindKeyMap();
    this.handleDragEvent();
    this.handleSelectionChange();
  }

  private handleSelectionChange() {
    this._disposables.add(
      this.tableView.selectionUpdated.on(tableSelection => {
        if (!this.isValidSelection(tableSelection)) {
          this.selection = undefined;
          return;
        }
        this.updateSelection(tableSelection);

        const old = this._databaseSelection;
        if (old) {
          const container = this.getCellContainer(
            old.focus.rowIndex,
            old.focus.columnIndex
          );
          if (container) {
            const cell = container.cell;
            if (old.isEditing) {
              cell?.onExitEditMode();
              cell?.blurCell();
              container.isEditing = false;
            }
          }
        }

        if (tableSelection) {
          const container = this.getCellContainer(
            tableSelection.focus.rowIndex,
            tableSelection.focus.columnIndex
          );
          if (container) {
            const cell = container.cell;
            if (tableSelection.isEditing) {
              cell?.onEnterEditMode();
              container.isEditing = true;
              cell?.focusCell();
            }
          }
        }

        this._databaseSelection = tableSelection;
      })
    );
  }

  private handleDragEvent() {
    let isDragging = false;
    this._disposables.add(
      this.tableView.handleEvent('dragStart', context => {
        isDragging = true;

        const event = context.get('pointerState').raw;
        const target = event.target;
        if (target instanceof Element) {
          const cell = target.closest('affine-database-cell-container');
          if (cell) {
            const selection = this.selection;
            if (
              selection &&
              selection.isEditing &&
              selection.focus.rowIndex === cell.rowIndex &&
              selection.focus.columnIndex === cell.columnIndex
            ) {
              return false;
            }
            this.startDrag(event, cell);
          }
          event.preventDefault();
          return true;
        }
        return false;
      })
    );

    this._disposables.add(
      this.tableView.handleEvent('dragMove', context => {
        if (isDragging) {
          const event = context.get('pointerState').raw;
          event.preventDefault();
        }
        return false;
      })
    );

    this._disposables.add(
      this.tableView.handleEvent('dragEnd', context => {
        isDragging = false;
        return false;
      })
    );
  }

  isValidSelection(selection?: TableViewSelection): boolean {
    if (!selection) {
      return true;
    }
    if (selection.focus.rowIndex > this.tableView.view.rows.length - 1) {
      this.selection = undefined;
      return false;
    }
    if (selection.focus.columnIndex > this.tableView.view.columns.length - 1) {
      this.selection = undefined;
      return false;
    }
    return true;
  }

  private clearSelection() {
    this.tableView.setSelection();
  }

  get selection(): TableViewSelection | undefined {
    return this._databaseSelection;
  }

  set selection(data: Omit<TableViewSelection, 'viewId' | 'type'> | undefined) {
    if (!data) {
      this.clearSelection();
      return;
    }
    const selection: TableViewSelection = {
      ...data,
      viewId: this.tableView.view.id,
      type: 'table',
    };
    if (selection.isEditing) {
      const focus = selection.focus;
      const container = this.getCellContainer(
        focus.rowIndex,
        focus.columnIndex
      );
      const cell = container?.cell;
      const isEditing = cell ? cell.beforeEnterEditMode() : true;
      this.tableView.setSelection({
        ...selection,
        isEditing,
      });
    } else {
      this.tableView.setSelection(selection);
    }
  }

  cellPosition(left: number, top: number) {
    const rows = this.rows();
    const cells = rows
      .item(0)
      .querySelectorAll('affine-database-cell-container');
    const rowOffsets: number[] = Array.from(rows).map(
      v => v.getBoundingClientRect().top - top
    );
    const columnOffsets: number[] = Array.from(cells).map(
      v => v.getBoundingClientRect().left - left
    );
    return (x1: number, x2: number, y1: number, y2: number) => {
      const [startX, endX] = x1 < x2 ? [x1, x2] : [x2, x1];
      const [startY, endY] = y1 < y2 ? [y1, y2] : [y2, y1];
      const row: MultiSelection = {
        start: 0,
        end: 0,
      };
      const column: MultiSelection = {
        start: 0,
        end: 0,
      };
      for (let i = 0; i < rowOffsets.length; i++) {
        const offset = rowOffsets[i];
        if (offset < startY) {
          row.start = i;
        }
        if (offset < endY) {
          row.end = i;
        }
      }
      for (let i = 0; i < columnOffsets.length; i++) {
        const offset = columnOffsets[i];
        if (offset < startX) {
          column.start = i;
        }
        if (offset < endX) {
          column.end = i;
        }
      }
      return {
        row,
        column,
      };
    };
  }

  startDrag(evt: PointerEvent, cell: DatabaseCellContainer) {
    const table = this.tableContainer;
    const tableRect = table.getBoundingClientRect();
    const startOffsetX = evt.x - tableRect.left;
    const startOffsetY = evt.y - tableRect.top;
    const offsetToSelection = this.cellPosition(tableRect.left, tableRect.top);
    const select = (selection: {
      row: MultiSelection;
      column: MultiSelection;
    }) => {
      this.selection = {
        rowsSelection: selection.row,
        columnsSelection: selection.column,
        focus: {
          rowIndex: cell.rowIndex,
          columnIndex: cell.columnIndex,
        },
        isEditing: false,
      };
    };
    startDrag<
      | {
          row: MultiSelection;
          column: MultiSelection;
        }
      | undefined,
      {
        x: number;
        y: number;
      }
    >(evt, {
      transform: evt => ({
        x: evt.x,
        y: evt.y,
      }),
      onDrag: () => undefined,
      onMove: ({ x, y }) => {
        const currentOffsetX = x - tableRect.left;
        const currentOffsetY = y - tableRect.top;
        const selection = offsetToSelection(
          currentOffsetX,
          startOffsetX,
          currentOffsetY,
          startOffsetY
        );
        select(selection);
        return selection;
      },
      onDrop: selection => {
        if (!selection) {
          return;
        }
        select(selection);
      },
      onClear: () => {
        //
      },
    });
  }

  private bindKeyMap() {
    this._disposables.add(
      this.tableView.bindHotkey({
        Backspace: ctx => {
          const selection = this.selection;
          if (!selection) {
            return;
          }
          const rowsSelection = selection.rowsSelection;
          if (rowsSelection && !selection.columnsSelection) {
            const rows = this.tableView.view.rows.filter(
              (_, i) => i >= rowsSelection.start && i <= rowsSelection.end
            );
            this.tableView.view.rowDelete(rows);
            this.focusTo(rowsSelection.start - 1, selection.focus.columnIndex);
          }
        },
        Escape: () => {
          const selection = this.selection;
          if (!selection) {
            return false;
          }
          const rowsSelection = selection.rowsSelection;
          if (selection.isEditing) {
            this.selection = {
              ...selection,
              isEditing: false,
            };
          } else {
            if (rowsSelection && !selection.columnsSelection) {
              this.selection = {
                ...selection,
                rowsSelection: undefined,
                columnsSelection: undefined,
              };
            } else {
              this.selection = {
                ...selection,
                rowsSelection: {
                  start: rowsSelection?.start ?? selection.focus.rowIndex,
                  end: rowsSelection?.end ?? selection.focus.rowIndex,
                },
                columnsSelection: undefined,
              };
            }
          }
          return true;
        },
        Enter: () => {
          const selection = this.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          this.selection = {
            ...selection,
            rowsSelection: undefined,
            columnsSelection: undefined,
            isEditing: true,
          };
          return true;
        },
        Tab: ctx => {
          const selection = this.selection;
          if (!selection || selection.isEditing) {
            return false;
          }

          const event = ctx.get('keyboardState').raw;
          event.preventDefault();
          const focuedColumnIndex = selection.focus.columnIndex;
          const focuedRowIndex = selection.focus.rowIndex;
          const columnLength = this.tableView.view.columnManagerList.length;
          const rowLength = this.tableView.view.rows.length;
          if (
            focuedColumnIndex === columnLength - 1 &&
            focuedRowIndex === rowLength - 1
          )
            return true;

          const isBoundary = focuedColumnIndex === columnLength - 1;
          const columnIndex = isBoundary ? 0 : focuedColumnIndex + 1;
          const rowIndex = isBoundary ? focuedRowIndex + 1 : focuedRowIndex;

          this.focusTo(rowIndex, columnIndex);
          return true;
        },
        'Shift-Tab': ctx => {
          const selection = this.selection;
          if (!selection || selection.isEditing) {
            return false;
          }

          const event = ctx.get('keyboardState').raw;
          event.preventDefault();
          const columnLength = this.tableView.view.columnManagerList.length;
          const focuedColumnIndex = selection.focus.columnIndex;
          const focuedRowIndex = selection.focus.rowIndex;
          if (focuedColumnIndex === 0 && focuedRowIndex === 0) return true;

          const isBoundary = focuedColumnIndex === 0;
          const columnIndex = isBoundary
            ? columnLength - 1
            : focuedColumnIndex - 1;
          const rowIndex = isBoundary ? focuedRowIndex - 1 : focuedRowIndex;

          this.focusTo(rowIndex, columnIndex);
          return true;
        },
        ArrowLeft: () => {
          const selection = this.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          const length = this.tableView.view.columnManagerList.length;
          const column = selection.focus.columnIndex - 1;
          this.focusTo(
            selection.focus.rowIndex + (column < 0 ? -1 : 0),
            column < 0 ? length - 1 : column
          );
          return true;
        },
        ArrowRight: () => {
          const selection = this.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          const length = this.tableView.view.columnManagerList.length;
          const column = selection.focus.columnIndex + 1;
          this.focusTo(
            selection.focus.rowIndex + (column >= length ? 1 : 0),
            column % length
          );
          return true;
        },
        ArrowUp: () => {
          const selection = this.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          this.focusTo(
            selection.focus.rowIndex - 1,
            selection.focus.columnIndex
          );
          return true;
        },
        ArrowDown: () => {
          const selection = this.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          this.focusTo(
            selection.focus.rowIndex + 1,
            selection.focus.columnIndex
          );
          return true;
        },
        'Mod-a': () => {
          const selection = this.selection;
          if (selection?.isEditing) {
            return true;
          }
          return;
        },
      })
    );
  }

  focusTo(rowIndex: number, columnIndex: number) {
    if (rowIndex < 0 || rowIndex >= this.tableView.view.rows.length) {
      return;
    }
    if (
      columnIndex < 0 ||
      columnIndex >= this.tableView.view.columnManagerList.length
    ) {
      return;
    }
    this.selection = {
      isEditing: false,
      focus: {
        rowIndex,
        columnIndex,
      },
    };
    this.focusRef.value?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });
  }

  selectRange(
    selection: TableViewSelection,
    row: MultiSelection,
    column: MultiSelection
  ) {
    this.selection = {
      ...selection,
      rowsSelection: row,
      columnsSelection: column,
      isEditing: false,
    };
  }

  getCellContainer(
    rowIndex: number,
    columnIndex: number
  ): DatabaseCellContainer | undefined {
    const row = this.rows().item(rowIndex);
    return row
      ?.querySelectorAll('affine-database-cell-container')
      .item(columnIndex);
  }

  private rows() {
    return this.tableContainer.querySelectorAll('.affine-database-block-row');
  }

  updateSelection(tableSelection = this.selection) {
    this.updateSelectionStyle(
      tableSelection?.rowsSelection,
      tableSelection?.columnsSelection
    );

    const isRowSelection =
      tableSelection?.rowsSelection && !tableSelection?.columnsSelection;
    this.updateFocusSelectionStyle(
      tableSelection?.focus,
      isRowSelection,
      tableSelection?.isEditing
    );
  }

  updateSelectionStyle(
    rowSelection?: MultiSelection,
    columnSelection?: MultiSelection
  ) {
    const div = this.selectionRef.value;
    if (!div) return;
    if (!rowSelection && !columnSelection) {
      div.style.display = 'none';
      return;
    }
    const tableRect = this.tableContainer.getBoundingClientRect();
    const { left, top, width, height, scale } = this.getRect(
      rowSelection?.start ?? 0,
      rowSelection?.end ?? this.tableView.view.rows.length - 1,
      columnSelection?.start ?? 0,
      columnSelection?.end ?? this.tableView.view.columnManagerList.length - 1
    );
    div.style.left = `${left - tableRect.left / scale}px`;
    div.style.top = `${top - tableRect.top / scale}px`;
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.display = 'block';
    const isRowSelection = rowSelection && !columnSelection;
    div.style.border = isRowSelection
      ? '2px solid var(--affine-primary-color)'
      : 'unset';
  }

  updateFocusSelectionStyle(
    focus?: CellFocus,
    isRowSelection?: boolean,
    isEditing = false
  ) {
    // Calculate styles after dom update.
    requestAnimationFrame(() => {
      const div = this.focusRef.value;
      if (!div) return;
      if (focus && !isRowSelection) {
        // Check if row is removed.
        const rows = this.rows();
        if (rows.length <= focus.rowIndex) return;

        const { left, top, width, height, scale } = this.getRect(
          focus.rowIndex,
          focus.rowIndex,
          focus.columnIndex,
          focus.columnIndex
        );
        const tableRect = this.tableContainer.getBoundingClientRect();
        div.style.left = `${left - tableRect.left / scale}px`;
        div.style.top = `${top - tableRect.top / scale}px`;
        div.style.width = `${width}px`;
        div.style.height = `${height}px`;
        div.style.borderColor = 'var(--affine-primary-color)';
        div.style.boxShadow = isEditing
          ? '0px 0px 0px 2px rgba(30, 150, 235, 0.30)'
          : 'unset';
        div.style.display = 'block';
      } else {
        div.style.display = 'none';
      }
    });
  }

  getRect(top: number, bottom: number, left: number, right: number) {
    const rows = this.rows();
    const topRow = rows.item(top);
    const bottomRow = rows.item(bottom);
    const topCells = topRow.querySelectorAll('affine-database-cell-container');
    const leftCell = topCells.item(left);
    const rightCell = topCells.item(right);
    const leftRect = leftCell.getBoundingClientRect();
    const scale = leftRect.width / leftCell.column.width;
    return {
      top: leftRect.top / scale,
      left: leftRect.left / scale,
      width: (rightCell.getBoundingClientRect().right - leftRect.left) / scale,
      height: (bottomRow.getBoundingClientRect().bottom - leftRect.top) / scale,
      scale,
    };
  }

  public selectRow(index: number) {
    this.selection = {
      rowsSelection: {
        start: index,
        end: index,
      },
      focus: {
        rowIndex: index,
        columnIndex: 0,
      },
      isEditing: false,
    };
  }

  public toggleRow(index: number) {
    const selection = this.selection;
    if (selection) {
      const rowsSelection = selection.rowsSelection;
      if (
        rowsSelection &&
        !selection.columnsSelection &&
        rowsSelection.start === index &&
        rowsSelection.end === index
      ) {
        this.selection = {
          ...selection,
          rowsSelection: undefined,
        };
        return;
      }
    }
    this.selection = {
      rowsSelection: {
        start: index,
        end: index,
      },
      focus: {
        rowIndex: index,
        columnIndex: 0,
      },
      isEditing: false,
    };
  }

  override render() {
    return html`
      <div ${ref(this.selectionRef)} class="database-selection"></div>
      <div tabindex="0" ${ref(this.focusRef)} class="database-focus"></div>
    `;
  }

  focusFirstCell() {
    this.selection = {
      focus: {
        rowIndex: 0,
        columnIndex: 0,
      },
      isEditing: true,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-selection': DatabaseSelectionView;
  }
}
