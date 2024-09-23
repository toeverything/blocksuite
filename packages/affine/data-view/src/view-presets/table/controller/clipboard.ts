import type { UIEventStateContext } from '@blocksuite/block-std';
import type { ReactiveController } from 'lit';

import { toast } from '@blocksuite/affine-components/toast';

import type { Cell } from '../../../core/view-manager/cell.js';
import type { Row } from '../../../core/view-manager/row.js';
import type { DataViewTable } from '../table-view.js';

import {
  TableAreaSelection,
  TableRowSelection,
  type TableViewSelection,
  type TableViewSelectionWithType,
} from '../types.js';

const BLOCKSUITE_DATABASE_TABLE = 'blocksuite/database/table';
type JsonAreaData = string[][];
const TEXT = 'text/plain';

export class TableClipboardController implements ReactiveController {
  private _onCopy = (
    tableSelection: TableViewSelectionWithType,
    isCut = false
  ) => {
    const table = this.host;

    const area = getSelectedArea(tableSelection, table);
    if (!area) {
      return;
    }
    const stringResult = area
      .map(row => row.cells.map(cell => cell.stringValue$.value).join('\t'))
      .join('\n');
    const jsonResult: JsonAreaData = area.map(row =>
      row.cells.map(cell => cell.stringValue$.value)
    );
    if (isCut) {
      const deleteRows: string[] = [];
      for (const row of area) {
        if (row.row) {
          deleteRows.push(row.row.rowId);
        } else {
          for (const cell of row.cells) {
            cell.valueSet(undefined);
          }
        }
      }
      if (deleteRows.length) {
        this.props.view.rowDelete(deleteRows);
      }
    }
    this.std.clipboard
      .writeToClipboard(items => {
        return {
          ...items,
          [TEXT]: stringResult,
          [BLOCKSUITE_DATABASE_TABLE]: JSON.stringify(jsonResult),
        };
      })
      .then(() => {
        if (area[0]?.row) {
          toast(
            this.std.host,
            `${area.length} row${area.length > 1 ? 's' : ''} copied to clipboard`
          );
        } else {
          const count = area.flatMap(row => row.cells).length;
          toast(
            this.std.host,
            `${count} cell${count > 1 ? 's' : ''} copied to clipboard`
          );
        }
      })
      .catch(console.error);

    return true;
  };

  private _onCut = (tableSelection: TableViewSelectionWithType) => {
    this._onCopy(tableSelection, true);
  };

  private _onPaste = async (_context: UIEventStateContext) => {
    const event = _context.get('clipboardState').raw;
    event.stopPropagation();
    const view = this.host;

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const tableSelection = this.host.selectionController.selection;
    if (TableRowSelection.is(tableSelection)) {
      return;
    }
    if (tableSelection) {
      const json = await this.std.clipboard.readFromClipboard(clipboardData);
      const dataString = json[BLOCKSUITE_DATABASE_TABLE];
      if (!dataString) return;
      const jsonAreaData = JSON.parse(dataString) as JsonAreaData;
      pasteToCells(view, jsonAreaData, tableSelection);
    }

    return true;
  };

  get props() {
    return this.host.props;
  }

  private get readonly() {
    return this.props.view.readonly$.value;
  }

  private get std() {
    return this.props.std;
  }

  constructor(public host: DataViewTable) {
    host.addController(this);
  }

  copy() {
    const tableSelection = this.host.selectionController.selection;
    if (!tableSelection) {
      return;
    }
    this._onCopy(tableSelection);
  }

  cut() {
    const tableSelection = this.host.selectionController.selection;
    if (!tableSelection) {
      return;
    }
    this._onCopy(tableSelection, true);
  }

  hostConnected() {
    this.host.disposables.add(
      this.props.handleEvent('copy', _ctx => {
        const tableSelection = this.host.selectionController.selection;
        if (!tableSelection) return false;

        this._onCopy(tableSelection);
        return true;
      })
    );

    this.host.disposables.add(
      this.props.handleEvent('cut', _ctx => {
        const tableSelection = this.host.selectionController.selection;
        if (!tableSelection) return false;

        this._onCut(tableSelection);
        return true;
      })
    );

    this.host.disposables.add(
      this.props.handleEvent('paste', ctx => {
        if (this.readonly) return false;

        this._onPaste(ctx).catch(console.error);
        return true;
      })
    );
  }
}

function getSelectedArea(
  selection: TableViewSelection,
  table: DataViewTable
): SelectedArea | undefined {
  const view = table.props.view;
  if (TableRowSelection.is(selection)) {
    const rows = TableRowSelection.rows(selection)
      .map(row => {
        const y =
          table.selectionController
            .getRow(row.groupKey, row.id)
            ?.getBoundingClientRect().y ?? 0;
        return {
          y,
          row,
        };
      })
      .sort((a, b) => a.y - b.y)
      .map(v => v.row);
    return rows.map(r => {
      const row = view.rowGet(r.id);
      return {
        row,
        cells: row.cells$.value,
      };
    });
  }
  const { rowsSelection, columnsSelection, groupKey } = selection;
  const data: SelectedArea = [];
  const rows = groupKey
    ? view.groupManager.groupDataMap$.value?.[groupKey].rows
    : view.rows$.value;
  const columns = view.propertyIds$.value;
  if (!rows) {
    return;
  }
  for (let i = rowsSelection.start; i <= rowsSelection.end; i++) {
    const row: SelectedArea[number] = {
      cells: [],
    };
    const rowId = rows[i];
    for (let j = columnsSelection.start; j <= columnsSelection.end; j++) {
      const columnId = columns[j];
      const cell = view.cellGet(rowId, columnId);
      row.cells.push(cell);
    }
    data.push(row);
  }

  return data;
}

type SelectedArea = {
  row?: Row;
  cells: Cell[];
}[];

function getTargetRangeFromSelection(
  selection: TableAreaSelection,
  data: JsonAreaData
) {
  const { rowsSelection, columnsSelection, focus } = selection;
  return TableAreaSelection.isFocus(selection)
    ? {
        row: {
          start: focus.rowIndex,
          length: data.length,
        },
        column: {
          start: focus.columnIndex,
          length: data[0].length,
        },
      }
    : {
        row: {
          start: rowsSelection.start,
          length: rowsSelection.end - rowsSelection.start + 1,
        },
        column: {
          start: columnsSelection.start,
          length: columnsSelection.end - columnsSelection.start + 1,
        },
      };
}

function pasteToCells(
  table: DataViewTable,
  rows: JsonAreaData,
  selection: TableAreaSelection
) {
  const srcRowLength = rows.length;
  const srcColumnLength = rows[0].length;
  const targetRange = getTargetRangeFromSelection(selection, rows);
  for (let i = 0; i < targetRange.row.length; i++) {
    for (let j = 0; j < targetRange.column.length; j++) {
      const rowIndex = targetRange.row.start + i;
      const columnIndex = targetRange.column.start + j;

      const srcRowIndex = i % srcRowLength;
      const srcColumnIndex = j % srcColumnLength;
      const dataString = rows[srcRowIndex][srcColumnIndex];

      const targetContainer = table.selectionController.getCellContainer(
        selection.groupKey,
        rowIndex,
        columnIndex
      );
      const rowId = targetContainer?.dataset.rowId;
      const columnId = targetContainer?.dataset.columnId;

      if (rowId && columnId) {
        targetContainer?.column.valueSetFromString(rowId, dataString);
      }
    }
  }
}
