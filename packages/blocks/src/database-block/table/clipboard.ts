import type { UIEventStateContext } from '@blocksuite/block-std';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { Text } from '@blocksuite/store';
import type { Ref } from 'lit/directives/ref.js';

import { ClipboardItem } from '../../__internal__/clipboard/clipboard-item.js';
import {
  CLIPBOARD_MIMETYPE,
  performNativeCopy,
} from '../../__internal__/clipboard/utils/pure.js';
import {
  getCurrentNativeRange,
  hasNativeSelection,
  resetNativeSelection,
} from '../../__internal__/utils/index.js';
import type { TableViewSelection } from '../../__internal__/utils/types.js';
import type { BaseViewClipboard } from '../common/clipboard.js';
import type { DataViewExpose } from '../common/data-view.js';
import type { DataViewManager } from '../common/data-view-manager.js';
import type { DatabaseSelection } from '../common/selection.js';
import type { DatabaseBlockModel } from '../database-model.js';
import type { DatabaseCellContainer } from '../table/components/cell-container.js';
import type { DatabaseTable } from '../table/table-view.js';
import type { DataViewTableManager } from './table-view-manager.js';

type TableViewClipboardConfig = {
  path: string[];
  model: DatabaseBlockModel;
  view: Ref<DataViewExpose | undefined>;
  data: DataViewManager;
};

export class TableViewClipboard implements BaseViewClipboard {
  private _disposables = new DisposableGroup();
  private _path: string[];
  private _model: DatabaseBlockModel;
  private _view: Ref<DataViewExpose | undefined>;
  private _data: DataViewTableManager;

  constructor(
    private _root: BlockSuiteRoot,
    config: TableViewClipboardConfig
  ) {
    this._path = config.path;
    this._model = config.model;
    this._view = config.view;
    this._data = config.data as DataViewTableManager;
  }

  init(): void {
    const { uiEventDispatcher } = this._root;

    this._disposables.add(
      uiEventDispatcher.add(
        'copy',
        ctx => {
          const selection = getDatabaseSelection(this._root);
          const tableSelection = selection?.getSelection('table');
          if (!tableSelection) return false;

          this._onCopy(ctx);
          return true;
        },
        { path: this._path }
      )
    );
    this._disposables.add(
      uiEventDispatcher.add('paste', this._onPaste, { path: this._path })
    );
  }

  private _onCopy = async (context: UIEventStateContext) => {
    const event = context.get('clipboardState').raw;
    const selection = getDatabaseSelection(this._root);
    const tableSelection = selection?.getSelection('table');
    if (!tableSelection) return;

    const view = this._view.value as DatabaseTable;
    const model = this._model;

    const { isEditing, focus } = tableSelection;

    // copy cells' content
    if (isEditing) {
      const column = model.columns[focus.columnIndex];
      const container = view.selection.getCellContainer(
        focus.rowIndex,
        focus.columnIndex
      );

      if (
        !(
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        )
      ) {
        const data = (cellToStringMap[column.type]?.(container) ??
          '') as string;
        const textClipboardItem = new ClipboardItem(
          CLIPBOARD_MIMETYPE.TEXT,
          data
        );

        const savedRange = hasNativeSelection()
          ? getCurrentNativeRange()
          : null;
        performNativeCopy([textClipboardItem]);
        if (savedRange) {
          resetNativeSelection(savedRange);
        }
      } else {
        // type === 'number' || type === 'title'
        // Execute browser default behavior
      }
      return true;
    }

    // cells
    // For database paste inside.
    const copyedValues = getCopyedValuesFromSelection(
      tableSelection,
      model,
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
    const cellsValue = copyCellsValue(tableSelection, model, view);
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

  private _onPaste = (context: UIEventStateContext) => {
    const event = context.get('clipboardState').raw;
    const view = this._view.value as DatabaseTable;
    const model = this._model;
    const data = this._data;

    const selection = getDatabaseSelection(this._root);
    const tableSelection = selection?.getSelection('table');
    if (tableSelection) {
      const {
        isEditing,
        focus: { rowIndex, columnIndex },
      } = tableSelection;

      // paste cells' content
      if (isEditing) {
        const column = model.columns[columnIndex];
        if (column.type !== 'number' && column.type !== 'title') {
          const textClipboardData = event.clipboardData?.getData(
            CLIPBOARD_MIMETYPE.TEXT
          );
          if (!textClipboardData) return true;

          const targetContainer = view.selection.getCellContainer(
            rowIndex,
            columnIndex
          );
          const rowId = targetContainer?.dataset.rowId;
          const columnId = targetContainer?.dataset.columnId;
          assertExists(rowId);
          assertExists(columnId);

          if (column.type === 'rich-text') {
            pasteToRichText(targetContainer, textClipboardData);
          } else {
            data.cellUpdateValue(rowId, columnId, textClipboardData);
          }
        } else {
          // type === 'number' || type === 'title'
          // Execute browser default behavior
        }

        return true;
      }

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
      const targetRange = getTargetRangeFromSelection(tableSelection, model);
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
        model,
        data,
        view,
        copyedSelectionData,
        rowStartIndex,
        columnStartIndex,
        rowLength,
        columnLength
      );
    }

    return true;
  };
}

function getDatabaseSelection(root: BlockSuiteRoot) {
  const selection = root.selectionManager.value.find(
    (selection): selection is DatabaseSelection => selection.is('database')
  );
  return selection;
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
  model: DatabaseBlockModel,
  view: DatabaseTable
) {
  const { rowsSelection, columnsSelection, focus } = selection;
  const values: string[][] = [];
  if (rowsSelection && !columnsSelection) {
    // rows
    const { start, end } = rowsSelection;
    const titleIndex = model.columns.findIndex(
      column => column.type === 'title'
    );
    for (let i = start; i <= end; i++) {
      const container = view.selection.getCellContainer(i, titleIndex);
      const data = (cellToStringMap['title']?.(container) ?? '') as string;
      values.push([data]);
    }
  } else if (rowsSelection && columnsSelection) {
    // multiple cells
    for (let i = rowsSelection.start; i <= rowsSelection.end; i++) {
      const value: string[] = [];
      for (let j = columnsSelection.start; j <= columnsSelection.end; j++) {
        const column = model.columns[j];
        const container = view.selection.getCellContainer(i, j);
        const data = (cellToStringMap[column.type]?.(container) ??
          '') as string;
        value.push(data);
      }
      values.push(value);
    }
  } else if (!rowsSelection && !columnsSelection && focus) {
    // single cell
    const column = model.columns[focus.columnIndex];
    const container = view.selection.getCellContainer(
      focus.rowIndex,
      focus.columnIndex
    );
    const data = (cellToStringMap[column.type]?.(container) ?? '') as string;
    values.push([data]);
  }

  return values;
}

type CopyedColumn = { type: string; value: string };
type CopyedSelectionData = CopyedColumn[][];
function getCopyedValuesFromSelection(
  selection: TableViewSelection,
  model: DatabaseBlockModel,
  view: DatabaseTable
): CopyedSelectionData {
  const { rowsSelection, columnsSelection, focus } = selection;
  const values: CopyedColumn[][] = [];
  if (rowsSelection && !columnsSelection) {
    // rows
    const { start, end } = rowsSelection;
    for (let i = start; i <= end; i++) {
      const cellValues: CopyedColumn[] = [];
      for (let j = 0; j < model.columns.length; j++) {
        const column = model.columns[j];
        const container = view.selection.getCellContainer(i, j);
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
        const column = model.columns[j];
        const container = view.selection.getCellContainer(i, j);
        const value = cellToStringMap[column.type]?.(container);
        cellValues.push({ type: column.type, value });
      }
      values.push(cellValues);
    }
  } else if (!rowsSelection && !columnsSelection && focus) {
    // single cell
    const container = view.selection.getCellContainer(
      focus.rowIndex,
      focus.columnIndex
    );
    const column = model.columns[focus.columnIndex];
    const value = cellToStringMap[column.type]?.(container);
    values.push([{ type: column.type, value }]);
  }
  return values;
}

function getTargetRangeFromSelection(
  selection: TableViewSelection,
  model: DatabaseBlockModel
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
        end: model.columns.length - 1,
        length: model.columns.length,
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

function pasteToRichText(
  container: DatabaseCellContainer | undefined,
  data: string
) {
  const cell = container?.querySelector(
    'affine-database-rich-text-cell-editing'
  );
  const range = cell?.vEditor?.getVRange();
  const yText = cell?.vEditor?.yText;
  if (yText) {
    const text = new Text(yText);
    const index = range?.index ?? yText.length;
    text.insert(data, index);
    cell?.vEditor?.setVRange({
      index: index + data.length,
      length: 0,
    });
  }
}

function pasteToCells(
  model: DatabaseBlockModel,
  data: DataViewTableManager,
  view: DatabaseTable,
  copyedSelectionData: CopyedSelectionData,
  rowStartIndex: number,
  columnStartIndex: number,
  rowLength: number,
  columnLength: number
) {
  const srcColumns = copyedSelectionData;
  const srcRowLength = srcColumns.length;
  const srcColumnLength = srcColumns[0].length;

  model.page.captureSync();
  for (let i = 0; i < rowLength; i++) {
    for (let j = 0; j < columnLength; j++) {
      const rowIndex = rowStartIndex + i;
      const columnIndex = columnStartIndex + j;

      const srcRowIndex = i % srcRowLength;
      const srcColumnIndex = j % srcColumnLength;
      const srcColumn = srcColumns[srcRowIndex][srcColumnIndex];

      const targetContainer = view.selection.getCellContainer(
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
