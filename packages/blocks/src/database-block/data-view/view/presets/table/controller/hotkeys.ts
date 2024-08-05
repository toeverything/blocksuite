import type { ReactiveController } from 'lit';

import type { DataViewTable } from '../table-view.js';

import { popRowMenu } from '../components/menu.js';
import { TableAreaSelection, TableRowSelection } from '../types.js';

export class TableHotkeysController implements ReactiveController {
  constructor(private host: DataViewTable) {
    this.host.addController(this);
  }

  hostConnected() {
    this.host.disposables.add(
      this.host.bindHotkey({
        Backspace: () => {
          const selection = this.selectionController.selection;
          if (!selection) {
            return;
          }
          if (TableRowSelection.is(selection)) {
            const rows = TableRowSelection.rowsIds(selection);
            this.selectionController.selection = undefined;
            this.host.view.rowDelete(rows);
            return;
          }
          const {
            focus,
            rowsSelection,
            columnsSelection,
            isEditing,
            groupKey,
          } = selection;
          if (focus && !isEditing) {
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
                    container?.column.setValueFromString(rowId, '');
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
                container?.column.setValueFromString(rowId, '');
              }
            }
          }
        },
        Escape: () => {
          const selection = this.selectionController.selection;
          if (!selection) {
            return false;
          }
          if (TableRowSelection.is(selection)) {
            const result = this.selectionController.rowsToArea(
              selection.rows.map(v => v.id)
            );
            if (result) {
              this.selectionController.selection = TableAreaSelection.create({
                groupKey: result.groupKey,
                focus: {
                  rowIndex: result.start,
                  columnIndex: 0,
                },
                rowsSelection: {
                  start: result.start,
                  end: result.end,
                },
                isEditing: false,
              });
            } else {
              this.selectionController.selection = undefined;
            }
          } else if (selection.isEditing) {
            this.selectionController.selection = {
              ...selection,
              isEditing: false,
            };
          } else {
            const rows = this.selectionController.areaToRows(selection);
            this.selectionController.rowSelectionChange({
              add: rows,
              remove: [],
            });
          }
          return true;
        },
        Enter: context => {
          const selection = this.selectionController.selection;
          if (!selection) {
            return false;
          }
          if (TableRowSelection.is(selection)) {
            const result = this.selectionController.rowsToArea(
              selection.rows.map(v => v.id)
            );
            if (result) {
              this.selectionController.selection = TableAreaSelection.create({
                groupKey: result.groupKey,
                focus: {
                  rowIndex: result.start,
                  columnIndex: 0,
                },
                rowsSelection: {
                  start: result.start,
                  end: result.end,
                },
                isEditing: false,
              });
            }
          } else if (selection.isEditing) {
            return false;
          } else {
            this.selectionController.selection = {
              ...selection,
              isEditing: true,
            };
          }
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        'Shift-Enter': () => {
          const selection = this.selectionController.selection;
          if (
            !selection ||
            TableRowSelection.is(selection) ||
            selection.isEditing
          ) {
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
          if (
            !selection ||
            TableRowSelection.is(selection) ||
            selection.isEditing
          ) {
            return false;
          }
          ctx.get('keyboardState').raw.preventDefault();
          this.selectionController.focusToCell('right');
          return true;
        },
        'Shift-Tab': ctx => {
          const selection = this.selectionController.selection;
          if (
            !selection ||
            TableRowSelection.is(selection) ||
            selection.isEditing
          ) {
            return false;
          }
          ctx.get('keyboardState').raw.preventDefault();
          this.selectionController.focusToCell('left');
          return true;
        },
        ArrowLeft: context => {
          const selection = this.selectionController.selection;
          if (
            !selection ||
            TableRowSelection.is(selection) ||
            selection.isEditing
          ) {
            return false;
          }
          this.selectionController.focusToCell('left');
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        ArrowRight: context => {
          const selection = this.selectionController.selection;
          if (
            !selection ||
            TableRowSelection.is(selection) ||
            selection.isEditing
          ) {
            return false;
          }
          this.selectionController.focusToCell('right');
          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        ArrowUp: context => {
          const selection = this.selectionController.selection;
          if (!selection) {
            return false;
          }

          if (TableRowSelection.is(selection)) {
            this.selectionController.navigateRowSelection('up', false);
          } else if (selection.isEditing) {
            return false;
          } else {
            this.selectionController.focusToCell('up');
          }

          context.get('keyboardState').raw.preventDefault();
          return true;
        },
        ArrowDown: context => {
          const selection = this.selectionController.selection;
          if (!selection) {
            return false;
          }

          if (TableRowSelection.is(selection)) {
            this.selectionController.navigateRowSelection('down', false);
          } else if (selection.isEditing) {
            return false;
          } else {
            this.selectionController.focusToCell('down');
          }

          context.get('keyboardState').raw.preventDefault();
          return true;
        },

        'Shift-ArrowUp': context => {
          const selection = this.selectionController.selection;
          if (!selection) {
            return false;
          }

          if (TableRowSelection.is(selection)) {
            this.selectionController.navigateRowSelection('up', true);
          } else if (selection.isEditing) {
            return false;
          } else {
            this.selectionController.selectionAreaUp();
          }

          context.get('keyboardState').raw.preventDefault();
          return true;
        },

        'Shift-ArrowDown': context => {
          const selection = this.selectionController.selection;
          if (!selection) {
            return false;
          }

          if (TableRowSelection.is(selection)) {
            this.selectionController.navigateRowSelection('down', true);
          } else if (selection.isEditing) {
            return false;
          } else {
            this.selectionController.selectionAreaDown();
          }

          context.get('keyboardState').raw.preventDefault();
          return true;
        },

        'Shift-ArrowLeft': context => {
          const selection = this.selectionController.selection;
          if (
            !selection ||
            TableRowSelection.is(selection) ||
            selection.isEditing ||
            this.selectionController.isRowSelection()
          ) {
            return false;
          }

          this.selectionController.selectionAreaLeft();

          context.get('keyboardState').raw.preventDefault();
          return true;
        },

        'Shift-ArrowRight': context => {
          const selection = this.selectionController.selection;
          if (
            !selection ||
            TableRowSelection.is(selection) ||
            selection.isEditing ||
            this.selectionController.isRowSelection()
          ) {
            return false;
          }

          this.selectionController.selectionAreaRight();

          context.get('keyboardState').raw.preventDefault();
          return true;
        },

        'Mod-a': context => {
          const selection = this.selectionController.selection;
          if (TableRowSelection.is(selection)) {
            return false;
          }
          if (selection?.isEditing) {
            return true;
          }
          if (selection) {
            context.get('keyboardState').raw.preventDefault();
            this.selectionController.selection = TableRowSelection.create({
              rows:
                this.host.view.groupHelper?.groups.flatMap(group =>
                  group.rows.map(id => ({ groupKey: group.key, id }))
                ) ??
                this.host.view.rows$.value.map(id => ({
                  groupKey: undefined,
                  id,
                })),
            });
            return true;
          }
          return;
        },
        '/': context => {
          const selection = this.selectionController.selection;
          if (!selection) {
            return;
          }
          if (TableRowSelection.is(selection)) {
            // open multi-rows context-menu
            return;
          }
          if (selection.isEditing) {
            return;
          }
          const cell = this.selectionController.getCellContainer(
            selection.groupKey,
            selection.focus.rowIndex,
            selection.focus.columnIndex
          );
          if (cell) {
            context.get('keyboardState').raw.preventDefault();
            const row = {
              id: cell.rowId,
              groupKey: selection.groupKey,
            };
            this.selectionController.selection = TableRowSelection.create({
              rows: [row],
            });
            popRowMenu(this.host.dataViewEle, cell, this.selectionController);
          }
        },
      })
    );
  }

  get selectionController() {
    return this.host.selectionController;
  }
}
