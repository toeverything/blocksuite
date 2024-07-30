import type { UIEventStateContext } from '@blocksuite/block-std';
import type { Y } from '@blocksuite/store';
import type { ReactiveController } from 'lit';

import { assertExists } from '@blocksuite/global/utils';

import type { DatabaseCellContainer } from '../components/cell-container.js';
import type { DataViewTable } from '../table-view.js';
import type { TableSingleView } from '../table-view-manager.js';

import { TableAreaSelection, TableRowSelection, type TableViewSelectionWithType } from '../types.js';

const BLOCKSUITE_DATABASE = 'blocksuite/database';
const TEXT = 'text/plain';

export class TableClipboardController implements ReactiveController {
  private _onCopy = (
    _context: UIEventStateContext,
    tableSelection: TableViewSelectionWithType,
    isCut = false
  ) => {
    const view = this.host;
    const data = this.host.view;

    // cells
    // For database paste inside.
    const copiedValues = getCopiedValuesFromSelection(
      tableSelection,
      data,
      view
    );

    // For database paste outside(raw text).
    const cellsValue = copyCellsValue(tableSelection, data, view, isCut);
    const formatValue = cellsValue.map(value => value.join('\t')).join('\n');
    this.std.clipboard
      .writeToClipboard(items => {
        return {
          ...items,
          [TEXT]: formatValue,
          [BLOCKSUITE_DATABASE]: JSON.stringify(copiedValues),
        };
      })
      .catch(console.error);

    return true;
  };

  private _onCut = (
    _context: UIEventStateContext,
    tableSelection: TableViewSelectionWithType
  ) => {
    this._onCopy(_context, tableSelection, true);
  };

  private _onPaste = async (_context: UIEventStateContext) => {
    const event = _context.get('clipboardState').raw;
    event.stopPropagation();
    const view = this.host;

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const tableSelection = this.host.selectionController.selection;
    if (tableSelection) {
      const json = await this.std.clipboard.readFromClipboard(clipboardData);
      const copiedValues = json[BLOCKSUITE_DATABASE];
      if (!copiedValues) return;
      const copyedSelectionData = JSON.parse(
        copiedValues
      ) as CopyedSelectionData;
      if (TableRowSelection.is(tableSelection)) {
        this.pasteToRows(tableSelection, copyedSelectionData);
      } else {
        pasteToCells(view, copyedSelectionData, tableSelection);
      }
      // paste cells
    }

    return true;
  };

  constructor(public host: DataViewTable) {
    host.addController(this);
  }

  private get readonly() {
    return this.host.view.readonly$.value;
  }

  private get std() {
    return this.host.std;
  }

  hostConnected() {
    this.host.disposables.add(
      this.host.handleEvent('copy', ctx => {
        const tableSelection = this.host.selectionController.selection;
        if (!tableSelection) return false;

        this._onCopy(ctx, tableSelection);
        return true;
      })
    );

    this.host.disposables.add(
      this.host.handleEvent('cut', ctx => {
        const tableSelection = this.host.selectionController.selection;
        if (!tableSelection) return false;

        this._onCut(ctx, tableSelection);
        return true;
      })
    );

    this.host.disposables.add(
      this.host.handleEvent('paste', ctx => {
        if (this.readonly) return false;

        this._onPaste(ctx).catch(console.error);
        return true;
      })
    );
  }

  pasteToRows(selection: TableRowSelection, data: CopyedSelectionData) {}
}

function getColumnValue(container: DatabaseCellContainer | undefined) {
  const rowId = container?.dataset.rowId;
  assertExists(rowId);
  return container?.column.getStringValue(rowId) ?? '';
}

/**
 * Columns that do not support cut operation yet
 */
const UNSUPPORTED_COLUMNS = ['progress', 'checkbox'];
function copyCellsValue(
  selection: TableViewSelectionWithType,
  data: TableSingleView,
  view: DataViewTable,
  isCut = false
) {
  const { rowsSelection, columnsSelection, focus, groupKey } = selection;
  const values: string[][] = [];
  if (rowsSelection && !columnsSelection) {
    // rows
    const { start, end } = rowsSelection;
    const titleIndex = data.columnsWithoutFilter$.value.findIndex(
      id => data.columnGetType(id) === 'title'
    );
    for (let i = start; i <= end; i++) {
      const container = view.selectionController.getCellContainer(
        groupKey,
        i,
        titleIndex
      );
      const value = (cellToStringMap['title']?.(container) ?? '') as string;
      values.push([value]);
    }
  } else if (rowsSelection && columnsSelection) {
    // multiple cells
    for (let i = rowsSelection.start; i <= rowsSelection.end; i++) {
      const value: string[] = [];
      for (let j = columnsSelection.start; j <= columnsSelection.end; j++) {
        const column = data.columnGet(data.columns$.value[j]);
        const container = view.selectionController.getCellContainer(
          groupKey,
          i,
          j
        );
        const cellValue = (cellToStringMap[column.type]?.(container) ??
          '') as string;
        if (!isCut) {
          value.push(cellValue);
        }
        if (isCut && !UNSUPPORTED_COLUMNS.includes(column.type)) {
          value.push(cellValue);
          container?.column.setValue(container.rowId, undefined);
          if (column.type === 'title' || column.type === 'rich-text') {
            const yText = container?.column.getValue(container.rowId) as Y.Text;
            yText.delete(0, yText.length);
          }
        }
      }
      values.push(value);
    }
  } else if (!rowsSelection && !columnsSelection && focus) {
    // single cell
    const column = data.columnGet(data.columns$.value[focus.columnIndex]);
    const container = view.selectionController.getCellContainer(
      groupKey,
      focus.rowIndex,
      focus.columnIndex
    );
    const value = (cellToStringMap[column.type]?.(container) ?? '') as string;
    if (!isCut) {
      values.push([value]);
    }
    if (isCut && !UNSUPPORTED_COLUMNS.includes(column.type)) {
      values.push([value]);
      container?.column.setValue(container.rowId, undefined);
      if (column.type === 'title' || column.type === 'rich-text') {
        const yText = container?.column.getValue(container.rowId) as Y.Text;
        yText.delete(0, yText.length);
      }
    }
  }

  return values;
}

type CopyedColumn = { type: string; value: string };
type CopyedSelectionData = CopyedColumn[][];
function getCopiedValuesFromSelection(
  selection: TableViewSelectionWithType,
  data: TableSingleView,
  view: DataViewTable
): CopyedSelectionData {
  const { rowsSelection, columnsSelection, focus, groupKey } = selection;
  const values: CopyedColumn[][] = [];
  if (rowsSelection && !columnsSelection) {
    // rows
    const { start, end } = rowsSelection;
    for (let i = start; i <= end; i++) {
      const cellValues: CopyedColumn[] = [];
      for (let j = 0; j < data.columns$.value.length; j++) {
        const column = data.columnGet(data.columns$.value[j]);
        const container = view.selectionController.getCellContainer(
          groupKey,
          i,
          j
        );
        const value = cellToStringMap[column.type]?.(container);
        cellValues.push({ type: column.type, value });
      }
      values.push(cellValues);
    }
  } else if (rowsSelection && columnsSelection) {
    // multiple cells
    for (let i = rowsSelection.start; i <= rowsSelection.end; i++) {
      const cellValues: CopyedColumn[] = [];
      for (let j = columnsSelection.start; j <= columnsSelection.end; j++) {
        const column = data.columnGet(data.columns$.value[j]);
        const container = view.selectionController.getCellContainer(
          groupKey,
          i,
          j
        );
        const value = cellToStringMap[column.type]?.(container);
        cellValues.push({ type: column.type, value });
      }
      values.push(cellValues);
    }
  } else if (!rowsSelection && !columnsSelection && focus) {
    // single cell
    const container = view.selectionController.getCellContainer(
      groupKey,
      focus.rowIndex,
      focus.columnIndex
    );
    const column = data.columnGet(data.columns$.value[focus.columnIndex]);
    const value = cellToStringMap[column.type]?.(container);
    values.push([{ type: column.type, value }]);
  }
  return values;
}

function getTargetRangeFromSelection(
  selection: TableAreaSelection,
  data: CopyedSelectionData
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
          length: data.length,
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
  view: DataViewTable,
  data: CopyedSelectionData,
  selection: TableAreaSelection
) {
  const targetRange = getTargetRangeFromSelection(selection, data);
  const srcColumns = data;
  const srcRowLength = srcColumns.length;
  const srcColumnLength = srcColumns[0].length;

  for (let i = 0; i < targetRange.row.length; i++) {
    for (let j = 0; j < targetRange.column.length; j++) {
      const rowIndex = targetRange.row.start + i;
      const columnIndex = targetRange.column.start + j;

      const srcRowIndex = i % srcRowLength;
      const srcColumnIndex = j % srcColumnLength;
      const srcColumn = srcColumns[srcRowIndex][srcColumnIndex];

      const targetContainer = view.selectionController.getCellContainer(
        selection.groupKey,
        rowIndex,
        columnIndex
      );
      const rowId = targetContainer?.dataset.rowId;
      const columnId = targetContainer?.dataset.columnId;

      if (rowId && columnId) {
        targetContainer?.column.setValueFromString(rowId, srcColumn.value);
      }
    }
  }
}

const cellToStringMap: Record<
  string,
  (container: DatabaseCellContainer | undefined) => string
> = {
  'rich-text': container => {
    const cell = container?.querySelector(
      'affine-database-rich-text-cell-editing'
    );
    const value = getColumnValue(container);
    const range = cell?.inlineEditor?.getInlineRange();
    if (range) {
      const start = range.index;
      const end = range.index + range.length;
      const data = value?.slice(start, end) ?? '';
      return data;
    }
    return value ?? '';
  },
  title: container => {
    const cell = container?.querySelector('data-view-header-area-text-editing');
    const value = getColumnValue(container);
    const range = cell?.inlineEditor?.getInlineRange();
    if (range) {
      const start = range.index;
      const end = range.index + range.length;
      const data = value?.slice(start, end) ?? '';
      return data;
    }
    return value ?? '';
  },
  date: container => {
    return getColumnValue(container);
  },
  number: container => {
    return getColumnValue(container);
  },
  select: container => {
    return getColumnValue(container);
  },
  'multi-select': container => {
    return getColumnValue(container);
  },
  progress: container => {
    return getColumnValue(container);
  },
  link: container => getColumnValue(container),
  checkbox: container => {
    return getColumnValue(container);
  },
};
