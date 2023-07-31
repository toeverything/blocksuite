import type { TextSelection, UIEventStateContext } from '@blocksuite/block-std';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { assertExists, DisposableGroup } from '@blocksuite/store';
import format from 'date-fns/format';
import type { Ref } from 'lit/directives/ref.js';

import { ClipboardItem } from '../../__internal__/clipboard/clipboard-item.js';
import {
  CLIPBOARD_MIMETYPE,
  performNativeCopy,
} from '../../__internal__/clipboard/utils/pure.js';
import type { TableViewSelection } from '../../__internal__/utils/types.js';
import type { BaseDataView } from '../common/base-data-view.js';
import type { BaseViewClipboard } from '../common/clipboard.js';
import type { DataViewManager } from '../common/data-view-manager.js';
import type { DatabaseSelection } from '../common/selection.js';
import type { DatabaseBlockModel } from '../database-model.js';
import type { DatabaseCellContainer } from '../table/components/cell-container.js';
import type { DatabaseTable } from '../table/table-view.js';
import type { DataViewTableManager } from './table-view-manager.js';

type TableViewClipboardConfig = {
  path: string[];
  model: DatabaseBlockModel;
  view: Ref<BaseDataView | undefined>;
  data: DataViewManager;
};

export class TableViewClipboard implements BaseViewClipboard {
  private _disposables = new DisposableGroup();
  private _path: string[];
  private _model: DatabaseBlockModel;
  private _view: Ref<BaseDataView | undefined>;
  private _data: DataViewTableManager;

  constructor(private _root: BlockSuiteRoot, config: TableViewClipboardConfig) {
    this._path = config.path;
    this._model = config.model;
    this._view = config.view;
    this._data = config.data as DataViewTableManager;
  }

  init(): void {
    const { uiEventDispatcher } = this._root;

    this._disposables.add(
      uiEventDispatcher.add('copy', this._onCopy, { path: this._path })
    );
    this._disposables.add(
      uiEventDispatcher.add('paste', this._onPaste, { path: this._path })
    );
  }

  private _onCopy = (context: UIEventStateContext) => {
    const selection = getDatabaseSelection(this._root);
    const tableSelection = selection?.getSelection('table');
    if (!tableSelection) return;

    const view = this._view.value as DatabaseTable;
    const model = this._model;

    // copy cells' content
    const { isEditing, focus } = tableSelection;
    const column = model.columns[focus.columnIndex];
    if (isEditing) {
      const container = view.selection.getCellContainer(
        focus.rowIndex,
        focus.columnIndex
      );

      if (column.type === 'number') {
        // Execute browser default behavior
        return true;
      } else {
        const data = selectionValueMap[column.type]?.(container) ?? '';
        const textClipboardItem = new ClipboardItem(
          CLIPBOARD_MIMETYPE.TEXT,
          data
        );
        performNativeCopy([textClipboardItem]);
        return true;
      }
    }

    // copy cells
    const stringifiesData = JSON.stringify(tableSelection);
    const htmlSelection = setHTMLStringForSelection(
      stringifiesData,
      CLIPBOARD_MIMETYPE.BLOCKSUITE_DATABASE
    );
    const htmlClipboardItem = new ClipboardItem(
      CLIPBOARD_MIMETYPE.HTML,
      htmlSelection
    );

    const cellsValue = copyCellsValue(tableSelection, model, view);
    const textClipboardItem = new ClipboardItem(
      CLIPBOARD_MIMETYPE.TEXT,
      cellsValue.join('')
    );
    performNativeCopy([textClipboardItem, htmlClipboardItem]);

    return true;
  };

  private _onPaste = (context: UIEventStateContext) => {
    const event = context.get('clipboardState').raw;
    const view = this._view.value as DatabaseTable;
    const model = this._model;
    const data = this._data;

    const selection = getDatabaseSelection(this._root);
    const tableSelection = selection?.getSelection('table');
    // When the title column is edited, it is the `TextSelection`.
    const titleSelection = getTextSelection(this._root, this._path);
    if (titleSelection) {
      // todo
    } else if (tableSelection) {
      const { isEditing } = tableSelection;

      // paste cells' content
      if (isEditing) {
        return true;
      }

      // paste cells
      const htmlClipboardData = event.clipboardData?.getData(
        CLIPBOARD_MIMETYPE.HTML
      );
      if (!htmlClipboardData) return true;
      const clipboardData = getSelectionFromHTMLString(
        CLIPBOARD_MIMETYPE.BLOCKSUITE_DATABASE,
        htmlClipboardData
      );
      if (!clipboardData) return true;

      const copyedSelection = JSON.parse(clipboardData) as TableViewSelection;
      const srcColumns = getSrcValuesFromSelection(
        copyedSelection,
        model,
        view
      );
      const srcRowLength = srcColumns.length;
      const srcColumnLength = srcColumns[0].length;

      const targetRange = getTargetRangeFromSelection(tableSelection, model);
      model.page.captureSync();
      for (let i = 0; i < targetRange.row.length; i++) {
        for (let j = 0; j < targetRange.column.length; j++) {
          const rowIndex = targetRange.row.start + i;
          const columnIndex = targetRange.column.start + j;
          const targetColumn = this._model.columns[columnIndex];

          const srcRowIndex = i % srcRowLength;
          const srcColumnIndex = j % srcColumnLength;
          const srcColumn = srcColumns[srcRowIndex][srcColumnIndex];

          // Can only be pasted when the column type is the same.
          if (targetColumn.type !== srcColumn.type) continue;

          const targetContainer = view.selection.getCellContainer(
            rowIndex,
            columnIndex
          );
          const rowId = targetContainer?.dataset.rowId;
          const columnId = targetContainer?.dataset.columnId;
          assertExists(rowId);
          assertExists(columnId);

          data.cellUpdateValue(rowId, columnId, srcColumn.value, false);
        }
      }
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

function getTextSelection(root: BlockSuiteRoot, path: string[]) {
  const selection = root.selectionManager.value.find(
    (selection): selection is TextSelection => selection.is('text')
  );

  const isDatabaseTitle = selection?.path.join('|').startsWith(path.join('|'));
  return isDatabaseTitle ? selection : undefined;
}

function getColumnValue(container: DatabaseCellContainer | undefined) {
  const rowId = container?.dataset.rowId;
  assertExists(rowId);
  const value = container?.column.getStringValue(rowId) ?? '';
  return value;
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
  const values: string[] = [];
  if (rowsSelection && !columnsSelection) {
    // rows
    const { start, end } = rowsSelection;
    const titleIndex = model.columns.findIndex(
      column => column.type === 'title'
    );
    for (let i = start; i <= end; i++) {
      const container = view.selection.getCellContainer(i, titleIndex);
      const value = selectionValueMap['title']?.(container) ?? '';
      values.push(value);
    }
  } else if (rowsSelection && columnsSelection) {
    // multiple cells
    for (let i = rowsSelection.start; i <= rowsSelection.end; i++) {
      for (let j = columnsSelection.start; j <= columnsSelection.end; j++) {
        const column = model.columns[j];
        const container = view.selection.getCellContainer(i, j);
        const value = selectionValueMap[column.type]?.(container) ?? '';
        values.push(value);
      }
    }
  } else if (!rowsSelection && !columnsSelection && focus) {
    // single cell
    const column = model.columns[focus.columnIndex];
    const container = view.selection.getCellContainer(
      focus.rowIndex,
      focus.columnIndex
    );
    const value = selectionValueMap[column.type]?.(container) ?? '';
    values.push(value);
  }

  return values;
}

function getSrcValuesFromSelection(
  selection: TableViewSelection,
  model: DatabaseBlockModel,
  view: DatabaseTable
) {
  type Column = { type: string; value: string };
  const { rowsSelection, columnsSelection, focus } = selection;
  const values: Column[][] = [];
  if (rowsSelection && !columnsSelection) {
    // rows
    const { start, end } = rowsSelection;
    for (let i = start; i <= end; i++) {
      const cellValues: Column[] = [];
      for (let j = 0; j < model.columns.length; j++) {
        const column = model.columns[j];
        const container = view.selection.getCellContainer(i, j);
        const value = selectionValueMap['title']?.(container) ?? '';
        cellValues.push({ type: column.type, value });
      }
      values.push(cellValues);
    }
  } else if (rowsSelection && columnsSelection) {
    // multiple cells
    for (let i = rowsSelection.start; i <= rowsSelection.end; i++) {
      const cellValues: Column[] = [];
      for (let j = columnsSelection.start; j <= columnsSelection.end; j++) {
        const column = model.columns[j];
        const container = view.selection.getCellContainer(i, j);
        const value = selectionValueMap[column.type]?.(container) ?? '';
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
    const value = selectionValueMap[column.type]?.(container) ?? '';
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

const selectionValueMap: Record<
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
      const data = value?.slice(start, end);
      return data;
    }
    return value;
  },
  title: container => {
    const cell = container?.querySelector('rich-text');
    const value = getColumnValue(container);
    const range = cell?.vEditor?.getVRange();
    if (range) {
      const start = range.index;
      const end = range.index + range.length;
      const data = value?.slice(start, end);
      return data;
    }
    return value;
  },
  // TODO: change date format
  date: container => format(Number(getColumnValue(container)), 'yyyy-MM-dd'),
  number: container => getColumnValue(container),
  select: container => getColumnValue(container),
  'multi-select': container => getColumnValue(container),
  progress: container => getColumnValue(container),
  link: container => getColumnValue(container),
};
