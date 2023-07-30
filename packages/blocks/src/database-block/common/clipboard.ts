import type { UIEventStateContext } from '@blocksuite/block-std';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { assertExists, DisposableGroup } from '@blocksuite/store';
import format from 'date-fns/format';

import { ClipboardItem } from '../../__internal__/clipboard/clipboard-item.js';
import {
  CLIPBOARD_MIMETYPE,
  performNativeCopy,
} from '../../__internal__/clipboard/utils/pure.js';
import type { TableViewSelection } from '../../__internal__/utils/types.js';
import type { DatabaseBlockComponent } from '../database-block.js';
import type { DatabaseBlockModel } from '../database-model.js';
import type { DatabaseCellContainer } from '../table/components/cell-container.js';
import type { DatabaseTable } from '../table/table-view.js';
import type { BaseDataView } from './base-data-view.js';
import type { DatabaseSelection } from './selection.js';

type DatabaseClipboardConfig = {
  path: string[];
  model: DatabaseBlockModel;
  view: BaseDataView | undefined;
};

export class DatabaseClipboard {
  private _disposables = new DisposableGroup();
  private _path: string[];
  private _model: DatabaseBlockModel;
  private _view: BaseDataView | undefined;

  constructor(private _root: BlockSuiteRoot, config: DatabaseClipboardConfig) {
    this._path = config.path;
    this._model = config.model;
    this._view = config.view;
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
    // const event = context.get('clipboardState').raw;

    const block = this._root.viewStore.blockViewMap.get(this._path) as
      | DatabaseBlockComponent
      | undefined;
    assertExists(block);

    const selection = getDatabaseSelection(this._root);
    if (!selection) return;

    const tableSelection = selection.getSelection('table');
    if (!tableSelection) return;
    const { rowsSelection, columnsSelection, isEditing, focus } =
      tableSelection;
    const view = this._view as DatabaseTable;

    // copy cell's content
    const column = this._model.columns[focus.columnIndex];
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

    // copy cell
    const values: string[] = [];
    if (rowsSelection && !columnsSelection) {
      // rows
      console.log('rows');
      const { start, end } = rowsSelection;
      const titleIndex = this._model.columns.findIndex(
        column => column.type === 'title'
      );
      for (let i = start; i <= end; i++) {
        const container = view.selection.getCellContainer(i, titleIndex);
        const value = selectionValueMap['title']?.(container) ?? '';
        values.push(value);
      }
    } else if (rowsSelection && columnsSelection) {
      // multiple cells
      console.log('multiple cells');
      for (let i = rowsSelection.start; i <= rowsSelection.end; i++) {
        for (let j = columnsSelection.start; j <= columnsSelection.end; j++) {
          const column = this._model.columns[j];
          const container = view.selection.getCellContainer(i, j);
          const value = selectionValueMap[column.type]?.(container) ?? '';
          values.push(value);
        }
      }
    } else if (!rowsSelection && !columnsSelection && focus) {
      // single cell
      console.log('single cell');
      const container = view.selection.getCellContainer(
        focus.rowIndex,
        focus.columnIndex
      );
      const value = selectionValueMap[column.type]?.(container) ?? '';
      values.push(value);
    }

    const stringifiesData = JSON.stringify(tableSelection);
    const htmlSelection = setHTMLStringForSelection(
      stringifiesData,
      CLIPBOARD_MIMETYPE.BLOCKSUITE_DATABASE
    );
    const htmlClipboardItem = new ClipboardItem(
      CLIPBOARD_MIMETYPE.HTML,
      htmlSelection
    );

    const textClipboardItem = new ClipboardItem(
      CLIPBOARD_MIMETYPE.TEXT,
      values.join('')
    );
    performNativeCopy([textClipboardItem, htmlClipboardItem]);
    return true;
  };

  private _onPaste = (context: UIEventStateContext) => {
    // console.log('db paste');
    const event = context.get('clipboardState').raw;
    const view = this._view as DatabaseTable;

    const selection = getDatabaseSelection(this._root);
    if (!selection) return true;
    const tableSelection = selection.getSelection('table');
    if (!tableSelection) return true;

    const { rowsSelection, columnsSelection, focus, isEditing } =
      tableSelection;

    const textClipboardData = event.clipboardData?.getData(
      CLIPBOARD_MIMETYPE.TEXT
    );

    if (textClipboardData) {
      if (isEditing) {
        // Execute browser default behavior
        return true;
      }
      return true;
    }

    const htmlClipboardData = event.clipboardData?.getData(
      CLIPBOARD_MIMETYPE.HTML
    );

    if (htmlClipboardData) {
      const clipboardData = getSelectionFromHTMLString(
        CLIPBOARD_MIMETYPE.BLOCKSUITE_DATABASE,
        htmlClipboardData
      );

      if (clipboardData) {
        const copyedSelection = JSON.parse(clipboardData) as TableViewSelection;

        if (rowsSelection && !columnsSelection) {
          // rows
          console.log('rows');
        } else if (rowsSelection && columnsSelection) {
          // multiple cells
          console.log('multiple cells');
        } else if (!rowsSelection && !columnsSelection && focus) {
          // single cell
          console.log('single cell');
          const targetColumn = this._model.columns[focus.columnIndex];
          const srcColumn =
            this._model.columns[copyedSelection.focus.columnIndex];

          if (targetColumn.type === srcColumn.type) {
            const container = view.selection.getCellContainer(
              copyedSelection.focus.rowIndex,
              copyedSelection.focus.columnIndex
            );
            const value =
              selectionValueMap[targetColumn.type]?.(container) ?? '';
            console.log(value);
          }
        }
      }
    }

    return true;
  };

  dispose(): void {
    this._disposables.dispose();
  }
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
