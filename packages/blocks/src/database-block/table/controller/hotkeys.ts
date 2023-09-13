import type { ReactiveController } from 'lit';

import { popRowMenu } from '../components/menu.js';
import type { DataViewTable } from '../table-view.js';

export class TableHotkeysController implements ReactiveController {
  constructor(private host: DataViewTable) {
    this.host.addController(this);
  }
  get selectionController() {
    return this.host.selectionController;
  }
  public hostConnected() {
    this.host.disposables.add(
      this.host.bindHotkey({
        Backspace: () => {
          const selection = this.selectionController.selection;
          if (!selection) {
            return;
          }
          const { focus, rowsSelection, columnsSelection, isEditing } =
            selection;
          if (rowsSelection && !columnsSelection) {
            const rows = this.host.view.rows.filter(
              (_, i) => i >= rowsSelection.start && i <= rowsSelection.end
            );
            this.host.view.rowDelete(rows);
            this.selectionController.focusTo(
              rowsSelection.start - 1,
              selection.focus.columnIndex
            );
          } else if (focus && !isEditing) {
            const data = this.host.view;
            if (rowsSelection && columnsSelection) {
              // multi cell
              for (let i = rowsSelection.start; i <= rowsSelection.end; i++) {
                const { start, end } = columnsSelection;
                for (let j = start; j <= end; j++) {
                  const container = this.selectionController.getCellContainer(
                    i,
                    j
                  );
                  const rowId = container?.dataset.rowId;
                  const columnId = container?.dataset.columnId;
                  if (rowId && columnId) {
                    const value = container?.column.setValueFromString('');
                    data.cellUpdateValue(rowId, columnId, value);
                  }
                }
              }
            } else {
              // single cell
              const container = this.selectionController.getCellContainer(
                focus.rowIndex,
                focus.columnIndex
              );
              const rowId = container?.dataset.rowId;
              const columnId = container?.dataset.columnId;
              if (rowId && columnId) {
                const value = container?.column.setValueFromString('');
                data.cellUpdateValue(rowId, columnId, value);
              }
            }
          }
        },
        Escape: () => {
          const selection = this.selectionController.selection;
          if (!selection) {
            return false;
          }
          const rowsSelection = selection.rowsSelection;
          if (selection.isEditing) {
            this.selectionController.selection = {
              ...selection,
              isEditing: false,
            };
          } else {
            if (rowsSelection && !selection.columnsSelection) {
              this.selectionController.selection = {
                ...selection,
                rowsSelection: undefined,
                columnsSelection: undefined,
              };
            } else {
              this.selectionController.selection = {
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
        Enter: context => {
          const selection = this.selectionController.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          this.selectionController.selection = {
            ...selection,
            rowsSelection: undefined,
            columnsSelection: undefined,
            isEditing: true,
          };
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        'Shift-Enter': () => {
          const selection = this.selectionController.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          const cell = this.selectionController.getCellContainer(
            selection.focus.rowIndex,
            selection.focus.columnIndex
          );
          if (cell) {
            this.selectionController.insertRowAfter(cell.rowId);
          }
          return true;
        },
        Tab: ctx => {
          const selection = this.selectionController.selection;
          if (!selection || selection.isEditing) {
            return false;
          }

          const event = ctx.get('keyboardState').raw;
          event.preventDefault();
          const focuedColumnIndex = selection.focus.columnIndex;
          const focuedRowIndex = selection.focus.rowIndex;
          const columnLength = this.host.view.columnManagerList.length;
          const rowLength = this.host.view.rows.length;
          if (
            focuedColumnIndex === columnLength - 1 &&
            focuedRowIndex === rowLength - 1
          )
            return true;

          const isBoundary = focuedColumnIndex === columnLength - 1;
          const columnIndex = isBoundary ? 0 : focuedColumnIndex + 1;
          const rowIndex = isBoundary ? focuedRowIndex + 1 : focuedRowIndex;

          this.selectionController.focusTo(rowIndex, columnIndex);
          return true;
        },
        'Shift-Tab': ctx => {
          const selection = this.selectionController.selection;
          if (!selection || selection.isEditing) {
            return false;
          }

          const event = ctx.get('keyboardState').raw;
          event.preventDefault();
          const columnLength = this.host.view.columnManagerList.length;
          const focuedColumnIndex = selection.focus.columnIndex;
          const focuedRowIndex = selection.focus.rowIndex;
          if (focuedColumnIndex === 0 && focuedRowIndex === 0) return true;

          const isBoundary = focuedColumnIndex === 0;
          const columnIndex = isBoundary
            ? columnLength - 1
            : focuedColumnIndex - 1;
          const rowIndex = isBoundary ? focuedRowIndex - 1 : focuedRowIndex;

          this.selectionController.focusTo(rowIndex, columnIndex);
          return true;
        },
        ArrowLeft: context => {
          const selection = this.selectionController.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          const length = this.host.view.columnManagerList.length;
          const column = selection.focus.columnIndex - 1;
          this.selectionController.focusTo(
            selection.focus.rowIndex + (column < 0 ? -1 : 0),
            column < 0 ? length - 1 : column
          );
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        ArrowRight: context => {
          const selection = this.selectionController.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          const length = this.host.view.columnManagerList.length;
          const column = selection.focus.columnIndex + 1;
          this.selectionController.focusTo(
            selection.focus.rowIndex + (column >= length ? 1 : 0),
            column % length
          );
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        ArrowUp: context => {
          const selection = this.selectionController.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          this.selectionController.focusTo(
            selection.focus.rowIndex - 1,
            selection.focus.columnIndex
          );
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        ArrowDown: context => {
          const selection = this.selectionController.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          this.selectionController.focusTo(
            selection.focus.rowIndex + 1,
            selection.focus.columnIndex
          );
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        'Mod-a': () => {
          const selection = this.selectionController.selection;
          if (selection?.isEditing) {
            return true;
          }
          if (selection) {
            const start = 0;
            const end = this.host.view.rows.length - 1;
            if (
              selection.rowsSelection?.start === start &&
              selection.rowsSelection.end === end &&
              !selection.columnsSelection
            ) {
              return false;
            }
            this.selectionController.selection = {
              rowsSelection: {
                start: start,
                end: end,
              },
              focus: selection.focus,
              isEditing: false,
            };
            return true;
          }
          return;
        },
        '/': context => {
          const selection = this.selectionController.selection;
          if (!selection || selection.columnsSelection || selection.isEditing) {
            return;
          }
          const cell = this.selectionController.getCellContainer(
            selection.focus.rowIndex,
            selection.focus.columnIndex
          );
          if (cell) {
            context.get('keyboardState').raw.preventDefault();
            popRowMenu(cell, cell.rowId, this.selectionController);
          }
        },
      })
    );
  }
}
