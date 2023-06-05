import type {
  EventName,
  UIEventDispatcher,
  UIEventHandler,
  UIEventStateContext,
} from '@blocksuite/lit';
import { caretRangeFromPoint, DisposableGroup } from '@blocksuite/store';

import { getService } from '../../../__internal__/service.js';
import { DragHandle } from '../../../components/drag-handle.js';
import {
  handleNativeRangeDragMove,
  isBlankArea,
  resetNativeSelection,
} from '../../../std.js';
import type { DatabaseBlockModel } from '../../database-model.js';
import type { DatabaseBlockService } from '../../database-service.js';
import { getDatabaseById } from '../components/selection/utils.js';
import {
  getClosestDatabase,
  getClosestDatabaseId,
  getSelectedRowIdsByIndexes,
  getSelectedRowIndexes,
  isInDatabase,
} from './utils.js';

export class RowSelectionManager {
  private readonly _dispatcher: UIEventDispatcher;
  private readonly _disposables = new DisposableGroup();
  private readonly _model: DatabaseBlockModel;

  private _service: DatabaseBlockService | null = null;
  private _startCell: HTMLElement | null = null;
  private _database: HTMLElement | null = null;
  private _columnWidthHandles: HTMLElement[] = [];
  private _startRange: Range | null = null;
  private _rowIds: string[] = [];
  private _isInDatabase = false;

  constructor(dispatcher: UIEventDispatcher, model: DatabaseBlockModel) {
    this._dispatcher = dispatcher;
    this._model = model;
    this._service = getService('affine:database');

    this._add('dragStart', this._onDragStart);
    this._add('dragMove', this._onDragMove);
    this._add('dragEnd', this._onDragEnd);
    this._add('click', this._onClick);
    this._add('keyDown', this._onKeydown);
  }

  private _onDragStart = (ctx: UIEventStateContext) => {
    const e = ctx.get('pointerState');

    const { clientX: x, clientY: y, target } = e.raw;
    const targetElement = target as HTMLElement;
    this._isInDatabase = isInDatabase(targetElement);
    if (!this._isInDatabase) {
      return false;
    }

    const startRange = caretRangeFromPoint(x, y);
    this._startRange = startRange;

    if (!isBlankArea(e)) {
      const el = document.elementFromPoint(x, y);
      this._startCell = el?.closest<HTMLElement>('.database-cell') ?? null;

      const database = getClosestDatabase(this._startCell);
      this._database = database;
      this._columnWidthHandles = Array.from(
        database.querySelectorAll<HTMLElement>(
          '.affine-database-column-drag-handle'
        )
      );
      this._setColumnWidthHandleDisplay('none');
    }
    return true;
  };

  private _onDragMove = (ctx: UIEventStateContext) => {
    if (!this._isInDatabase) {
      return false;
    }

    const e = ctx.get('pointerState');
    e.raw.preventDefault();

    const { clientX: x, clientY: y, target } = e.raw;
    if (!isInDatabase(target as HTMLElement)) {
      return false;
    }

    // In order to avoid missing the underlying database-related elements, use `elementsFromPoint` instead
    const elements = Array.from(document.elementsFromPoint(x, y));

    const endCell = elements.find(el => el.classList.contains('database-cell'));
    const startCell = this._startCell;
    if (!endCell || !startCell || !this._database) return false;

    if (endCell === startCell) {
      // current cell, native selection
      const editor = elements.find(el => el.classList.contains('virgo-editor'));
      if (editor) {
        const { left, right } = editor.getBoundingClientRect();
        // Prevent native cross-cell selections from being generated
        if (x <= left + 1 || x >= right - 1) {
          return true;
        }

        handleNativeRangeDragMove(this._startRange, e);
      }

      if (this._rowIds.length > 0) {
        this._clearRowSelection();
      }
    } else {
      // cross cell, row-level selection
      e.raw.preventDefault();
      resetNativeSelection(null);

      const rowIndexes = getSelectedRowIndexes(startCell, endCell);
      const rowIds = getSelectedRowIdsByIndexes(this._database, rowIndexes);
      this._rowIds = rowIds;

      const databaseId = getClosestDatabaseId(endCell);
      this._service?.setRowSelection({
        type: 'select',
        rowIds,
        databaseId,
      });
    }

    return true;
  };

  private _onDragEnd = (ctx: UIEventStateContext) => {
    const e = ctx.get('pointerState');
    const target = e.raw.target as HTMLElement;
    if (!isInDatabase(target)) {
      return;
    }

    this._startRange = null;
    this._setColumnWidthHandleDisplay('block');
  };

  private _onClick = (ctx: UIEventStateContext) => {
    const e = ctx.get('pointerState');
    const target = e.raw.target as HTMLElement;

    if (target instanceof DragHandle) return;

    const rowSelection = this._service?.getLastRowSelection();
    if (rowSelection) {
      this._clearRowSelection();
    }
  };

  private _onKeydown = (ctx: UIEventStateContext) => {
    const e = ctx.get('keyboardState');
    const event = e.raw;

    const key = event.key;
    if (key === 'Delete' || key === 'Backspace') {
      this._onRowSelectionDelete();
    } else if (key === 'Escape') {
      const service = getService('affine:database');
      const cellSelection = service.getLastCellSelection();
      if (cellSelection) {
        const {
          databaseId,
          coords: [coord],
        } = cellSelection;
        // clear cell selection
        service.clearCellLevelSelection();

        // select row
        const database = getDatabaseById(databaseId);
        const rowIds = getSelectedRowIdsByIndexes(database, [coord.rowIndex]);
        service.setRowSelection({
          type: 'select',
          rowIds,
          databaseId,
        });
      }
    }
  };

  private _onRowSelectionDelete = () => {
    const service = getService('affine:database');
    const rowSelection = service.getLastRowSelection();
    if (!rowSelection) return;

    const { rowIds } = rowSelection;
    const page = this._model.page;
    const children = this._model.children;
    page.captureSync();
    if (children.length === rowIds.length) {
      // delete the database
      page.deleteBlock(this._model);
    } else {
      // delete rows
      page.updateBlock(this._model, {
        children: children.filter(child => rowIds.indexOf(child.id) === -1),
      });
    }
    service.clearRowSelection();

    return true;
  };

  private _setColumnWidthHandleDisplay(display: string) {
    this._columnWidthHandles.forEach(handle => {
      handle.style.display = display;
    });
  }

  private _clearRowSelection() {
    this._rowIds = [];
    this._service?.clearRowSelection();
    resetNativeSelection(null);
  }

  private _add = (name: EventName, fn: UIEventHandler) => {
    this._disposables.add(this._dispatcher.add(name, fn));
  };

  dispose() {
    this._disposables.dispose();
  }
}
