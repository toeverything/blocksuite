import {
  handleNativeRangeDragMove,
  isBlankArea,
  type SelectionEvent,
} from '../../../../__internal__/index.js';
import { getService } from '../../../../__internal__/service.js';
import type { DatabaseBlockService } from '../../../../database-block/database-service.js';
import type { DefaultSelectionManager } from '../default-selection-manager.js';
import {
  getClosestDatabase,
  getClosestDatabaseId,
  getSelectedRowIds,
} from './utils.js';

export class DatabaseTableViewSelectionManager {
  private _service: DatabaseBlockService | null = null;
  private _startCell: HTMLElement | null = null;
  private _columnWidthHandles: HTMLElement[] = [];
  private _startRange: Range | null = null;
  private _rowIds: number[] = [];

  onDragStart(selection: DefaultSelectionManager, e: SelectionEvent) {
    if (!isBlankArea(e)) {
      selection.state.resetStartRange(e);
      selection.state.type = 'database';

      const { clientX: x, clientY: y } = e.raw;
      const el = document.elementFromPoint(x, y);
      this._startCell = el?.closest<HTMLElement>('.database-cell') ?? null;

      const database = getClosestDatabase(this._startCell);
      this._columnWidthHandles = Array.from(
        database.querySelectorAll<HTMLElement>(
          '.affine-database-column-drag-handle'
        )
      );
      this._setColumnWidthHandleDisplay('none');

      this._service = getService('affine:database');
    }
  }

  onDragMove(selection: DefaultSelectionManager, e: SelectionEvent) {
    const { clientX: x, clientY: y } = e.raw;

    const el = document.elementFromPoint(x, y);
    const endCell = el?.closest<HTMLElement>('.database-cell');
    const startCell = this._startCell;
    if (!endCell || !startCell) return;

    const databaseId = getClosestDatabaseId(endCell);
    if (endCell === startCell) {
      // current cell, native selection
      const editor = el?.closest('.virgo-editor');
      if (editor) {
        const { left, right } = editor.getBoundingClientRect();
        // Prevent native cross-cell selections from being generated
        if (x <= left + 1 || x >= right - 1) {
          return;
        }

        handleNativeRangeDragMove(
          selection.state.startRange ?? this._startRange,
          e
        );
      }

      if (this._rowIds.length > 0) {
        this._clearRowSelection(selection, databaseId);
      }
    } else {
      // cross cell, row-level selection
      e.raw.preventDefault();
      if (selection.state.startRange) {
        this._startRange = selection.state.startRange;
      }
      selection.state.clearSelection();

      const rowIds = getSelectedRowIds(startCell, endCell);
      this._rowIds = rowIds;

      this._service?.setTableViewSelection({
        type: 'select',
        rowIds,
        databaseId,
      });
    }
    selection.state.type = 'database';
  }

  onDragEnd(selection: DefaultSelectionManager, e: SelectionEvent) {
    this._setColumnWidthHandleDisplay('block');
  }

  private _setColumnWidthHandleDisplay(display: string) {
    this._columnWidthHandles.forEach(handle => {
      handle.style.display = display;
    });
  }

  private _clearRowSelection(
    selection: DefaultSelectionManager,
    databaseId: string
  ) {
    this._rowIds = [];
    this._service?.setTableViewSelection({
      type: 'select',
      rowIds: [],
      databaseId,
    });
    selection.state.clearSelection();
  }
}
