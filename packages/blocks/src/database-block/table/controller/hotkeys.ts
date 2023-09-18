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
          const {
            focus,
            rowsSelection,
            columnsSelection,
            isEditing,
            groupKey,
          } = selection;
          if (rowsSelection && !columnsSelection) {
            const rows = this.host.view.rows.filter(
              (_, i) => i >= rowsSelection.start && i <= rowsSelection.end
            );
            this.selectionController.focusTo('up');
            this.host.view.rowDelete(rows);
          } else if (focus && !isEditing) {
            const data = this.host.view;
            if (rowsSelection && columnsSelection) {
              // multi cell
              for (let i = rowsSelection.start; i <= rowsSelection.end; i++) {
                const { start, end } = columnsSelection;
                for (let j = start; j <= end; j++) {
                  const container = this.selectionController.getCellContainer(
                    groupKey,
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
                groupKey,
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
            selection.groupKey,
            selection.focus.rowIndex,
            selection.focus.columnIndex
          );
          if (cell) {
            this.selectionController.insertRowAfter(
              selection.groupKey,
              cell.rowId
            );
          }
          return true;
        },
        Tab: ctx => {
          const selection = this.selectionController.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          ctx.get('keyboardState').raw.preventDefault();
          this.selectionController.focusTo('right');
          return true;
        },
        'Shift-Tab': ctx => {
          const selection = this.selectionController.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          ctx.get('keyboardState').raw.preventDefault();
          this.selectionController.focusTo('left');
          return true;
        },
        ArrowLeft: context => {
          const selection = this.selectionController.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          this.selectionController.focusTo('left');
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        ArrowRight: context => {
          const selection = this.selectionController.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          this.selectionController.focusTo('right');
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        ArrowUp: context => {
          const selection = this.selectionController.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          this.selectionController.focusTo('up');
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        ArrowDown: context => {
          const selection = this.selectionController.selection;
          if (!selection || selection.isEditing) {
            return false;
          }
          this.selectionController.focusTo('down');
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
            selection.groupKey,
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
