import type { UIEventStateContext } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { ReactiveController } from 'lit';

import { ClipboardItem } from '../../../__internal__/clipboard/clipboard-item.js';
import {
  CLIPBOARD_MIMETYPE,
  performNativeCopy,
} from '../../../__internal__/clipboard/utils/pure.js';
import {
  getCurrentNativeRange,
  hasNativeSelection,
  resetNativeSelection,
} from '../../../__internal__/utils/index.js';
import type { TableViewSelection } from '../../../__internal__/utils/types.js';
import type { DatabaseCellContainer } from '../components/cell-container.js';
import type { DataViewTable } from '../table-view.js';
import type { DataViewTableManager } from '../table-view-manager.js';

export class TableClipboardController implements ReactiveController {
  constructor(public host: DataViewTable) {
    host.addController(this);
  }

  private get readonly() {
    return this.host.view.readonly;
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
      this.host.handleEvent('paste', ctx => {
        if (this.readonly) return false;

        this._onPaste(ctx);
        return true;
      })
    );
  }

  private _onCopy = async (
    _context: UIEventStateContext,
    tableSelection: TableViewSelection
  ) => {
    const view = this.host;
    const data = this.host.view;

    // cells
    // For database paste inside.
    const copyedValues = getCopyedValuesFromSelection(
      tableSelection,
      data,
      view
    );
    const stringifiesData = JSON.stringify(copyedValues);
    const tableHtmlSelection = setHTMLStringForSelection(
      stringifiesData,
      CLIPBOARD_MIMETYPE.BLOCKSUITE_DATABASE
    );
    const tableClipboardItem = new ClipboardItem(
      CLIPBOARD_MIMETYPE.BLOCKSUITE_DATABASE,
      tableHtmlSelection
    );

    // For database paste outside(raw text).
    const cellsValue = copyCellsValue(tableSelection, data, view);
    const formatValue = cellsValue.map(value => value.join('\t')).join('\n');
    const textClipboardItem = new ClipboardItem(
      CLIPBOARD_MIMETYPE.TEXT,
      formatValue
    );

    const savedRange = hasNativeSelection() ? getCurrentNativeRange() : null;
    performNativeCopy([textClipboardItem, tableClipboardItem]);
    if (savedRange) {
      resetNativeSelection(savedRange);
    }

    return true;
  };

  private _onPaste = (_context: UIEventStateContext) => {
    const event = _context.get('clipboardState').raw;
    const view = this.host;
    const data = this.host.view;

    const tableSelection = this.host.selectionController.selection;
    if (tableSelection) {
      const htmlClipboardData = event.clipboardData?.getData(
        CLIPBOARD_MIMETYPE.BLOCKSUITE_DATABASE
      );
      if (!htmlClipboardData) return true;
      const clipboardData = getSelectionFromHTMLString(
        CLIPBOARD_MIMETYPE.BLOCKSUITE_DATABASE,
        htmlClipboardData
      );
      if (!clipboardData) return true;

      // paste cells
      const copyedSelectionData = JSON.parse(
        clipboardData
      ) as CopyedSelectionData;
      const targetRange = getTargetRangeFromSelection(tableSelection, data);
      let rowStartIndex = targetRange.row.start;
      let columnStartIndex = targetRange.column.start;
      let rowLength = targetRange.row.length;
      let columnLength = targetRange.column.length;

      if (targetRange.anchor) {
        rowStartIndex = tableSelection.focus.rowIndex;
        columnStartIndex = tableSelection.focus.columnIndex;
        rowLength = copyedSelectionData.length;
        columnLength = copyedSelectionData[0].length;
      }

      pasteToCells(
        data,
        view,
        copyedSelectionData,
        tableSelection.groupKey,
        rowStartIndex,
        columnStartIndex,
        rowLength,
        columnLength
      );
    }

    return true;
  };
}

function getColumnValue(container: DatabaseCellContainer | undefined) {
  const rowId = container?.dataset.rowId;
  assertExists(rowId);
  return container?.column.getStringValue(rowId) ?? '';
}

function setHTMLStringForSelection(data: string, type: CLIPBOARD_MIMETYPE) {
  return `<database style="display: none" data-type="${type}" data-clipboard="${data.replace(
    /"/g,
    '&quot;'
  )}"></database>`;
}

function getSelectionFromHTMLString(type: CLIPBOARD_MIMETYPE, html: string) {
  const dom = new DOMParser().parseFromString(html, 'text/html');
  const ele = dom.querySelector(`database[data-type="${type}"]`);
  return ele?.getAttribute('data-clipboard');
}

function copyCellsValue(
  selection: TableViewSelection,
  data: DataViewTableManager,
  view: DataViewTable
) {
  const { rowsSelection, columnsSelection, focus, groupKey } = selection;
  const values: string[][] = [];
  if (rowsSelection && !columnsSelection) {
    // rows
    const { start, end } = rowsSelection;
    const titleIndex = data.columnsWithoutFilter.findIndex(
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
        const column = data.columnGet(data.columns[j]);
        const container = view.selectionController.getCellContainer(
          groupKey,
          i,
          j
        );
        const cellValue = (cellToStringMap[column.type]?.(container) ??
          '') as string;
        value.push(cellValue);
      }
      values.push(value);
    }
  } else if (!rowsSelection && !columnsSelection && focus) {
    // single cell
    const column = data.columnGet(data.columns[focus.columnIndex]);
    const container = view.selectionController.getCellContainer(
      groupKey,
      focus.rowIndex,
      focus.columnIndex
    );
    const value = (cellToStringMap[column.type]?.(container) ?? '') as string;
    values.push([value]);
  }

  return values;
}

type CopyedColumn = { type: string; value: string };
type CopyedSelectionData = CopyedColumn[][];
function getCopyedValuesFromSelection(
  selection: TableViewSelection,
  data: DataViewTableManager,
  view: DataViewTable
): CopyedSelectionData {
  const { rowsSelection, columnsSelection, focus, groupKey } = selection;
  const values: CopyedColumn[][] = [];
  if (rowsSelection && !columnsSelection) {
    // rows
    const { start, end } = rowsSelection;
    for (let i = start; i <= end; i++) {
      const cellValues: CopyedColumn[] = [];
      for (let j = 0; j < data.columns.length; j++) {
        const column = data.columnGet(data.columns[j]);
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
        const column = data.columnGet(data.columns[j]);
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
    const column = data.columnGet(data.columns[focus.columnIndex]);
    const value = cellToStringMap[column.type]?.(container);
    values.push([{ type: column.type, value }]);
  }
  return values;
}

function getTargetRangeFromSelection(
  selection: TableViewSelection,
  data: DataViewTableManager
) {
  const { rowsSelection, columnsSelection, focus } = selection;
  let range: {
    row: { start: number; end: number; length: number };
    column: { start: number; end: number; length: number };
    anchor?: boolean;
  } = {
    row: {
      start: 0,
      end: 0,
      length: 0,
    },
    column: {
      start: 0,
      end: 0,
      length: 0,
    },
  };

  if (rowsSelection && !columnsSelection) {
    // rows
    range = {
      row: {
        start: rowsSelection.start,
        end: rowsSelection.end,
        length: rowsSelection.end - rowsSelection.start + 1,
      },
      column: {
        start: 0,
        end: data.columns.length - 1,
        length: data.columns.length,
      },
    };
    if (rowsSelection.start === rowsSelection.end) {
      range.anchor = true;
    }
  } else if (rowsSelection && columnsSelection) {
    // multiple cells
    range = {
      row: {
        start: rowsSelection.start,
        end: rowsSelection.end,
        length: rowsSelection.end - rowsSelection.start + 1,
      },
      column: {
        start: columnsSelection.start,
        end: columnsSelection.end,
        length: columnsSelection.end - columnsSelection.start + 1,
      },
    };
  } else if (!rowsSelection && !columnsSelection && focus) {
    // single cell
    range = {
      anchor: true,
      row: {
        start: focus.rowIndex,
        end: focus.rowIndex,
        length: 1,
      },
      column: {
        start: focus.columnIndex,
        end: focus.columnIndex,
        length: 1,
      },
    };
  }
  return range;
}

function pasteToCells(
  data: DataViewTableManager,
  view: DataViewTable,
  copyedSelectionData: CopyedSelectionData,
  groupKey: string | undefined,
  rowStartIndex: number,
  columnStartIndex: number,
  rowLength: number,
  columnLength: number
) {
  const srcColumns = copyedSelectionData;
  const srcRowLength = srcColumns.length;
  const srcColumnLength = srcColumns[0].length;

  for (let i = 0; i < rowLength; i++) {
    for (let j = 0; j < columnLength; j++) {
      const rowIndex = rowStartIndex + i;
      const columnIndex = columnStartIndex + j;

      const srcRowIndex = i % srcRowLength;
      const srcColumnIndex = j % srcColumnLength;
      const srcColumn = srcColumns[srcRowIndex][srcColumnIndex];

      const targetContainer = view.selectionController.getCellContainer(
        groupKey,
        rowIndex,
        columnIndex
      );
      const rowId = targetContainer?.dataset.rowId;
      const columnId = targetContainer?.dataset.columnId;

      if (rowId && columnId) {
        const value = targetContainer?.column.setValueFromString(
          srcColumn.value
        );
        data.cellUpdateValue(rowId, columnId, value);
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
    const range = cell?.vEditor?.getVRange();
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
    const range = cell?.vEditor?.getVRange();
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
