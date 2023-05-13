import { assertExists, caretRangeFromPoint } from '@blocksuite/store/index.js';

import {
  handleNativeRangeDragMove,
  isBlankArea,
  type SelectionEvent,
} from '../../../../__internal__/index.js';
import type { DefaultSelectionSlots } from '../../../../index.js';
import type { DefaultSelectionManager } from '../default-selection-manager.js';
import type { PageSelectionState } from '../selection-state.js';

export class DatabaseTableViewSelectionManager {
  readonly state: PageSelectionState;
  readonly slots: DefaultSelectionSlots;

  private _startCell: HTMLElement | null = null;
  private _startRow: HTMLElement | null = null;
  private _columnWidthHandles: HTMLElement[] = [];
  private _startRange: Range | null = null;
  private _rowIds: number[] = [];

  constructor(state: PageSelectionState, slots: DefaultSelectionSlots) {
    this.state = state;
    this.slots = slots;
  }

  onStart(selection: DefaultSelectionManager, e: SelectionEvent) {
    if (!isBlankArea(e)) {
      selection.slots.databaseTableUpdated.emit({
        stage: 'start',
      });
      selection.state.resetStartRange(e);
      selection.state.type = 'database';

      const { clientX: x, clientY: y } = e.raw;
      const el = document.elementFromPoint(x, y);
      this._startCell = el?.closest<HTMLElement>('.database-cell') ?? null;
      this._startRow = el?.closest<HTMLElement>('.database-row') ?? null;
      this._columnWidthHandles = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.affine-database-column-drag-handle'
        )
      );
      this._columnWidthHandles.forEach(handle => {
        handle.style.display = 'none';
      });
    }
  }

  onMove(selection: DefaultSelectionManager, e: SelectionEvent) {
    // console.log('move');
    const { clientX: x, clientY: y } = e.raw;

    // Range from current mouse position
    const currentRange = caretRangeFromPoint(x, y);
    if (!currentRange) return;

    const el = document.elementFromPoint(x, y);
    const currentCell = el?.closest('.database-cell');
    if (!currentCell || !this._startCell) return;

    const databaseId = currentCell
      .closest('affine-database')
      ?.getAttribute('data-block-id');
    assertExists(databaseId);

    if (currentCell === this._startCell) {
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
        this._rowIds = [];
        selection.slots.databaseTableUpdated.emit({
          stage: 'move',
          rowIds: [],
          databaseId,
        });
        selection.state.clearSelection();
      }
    } else {
      e.raw.preventDefault();
      if (selection.state.startRange) {
        this._startRange = selection.state.startRange;
      }
      selection.state.clearSelection();
      // cross cell, row-level selection
      const _currentRowId = currentCell
        .closest('.database-row')
        ?.getAttribute('data-row-id');
      assertExists(_currentRowId);
      const _startRowId = this._startRow?.getAttribute('data-row-id');
      assertExists(_startRowId);

      const currentRowId = Number(_currentRowId);
      const startRowId = Number(_startRowId);
      const minId = Math.min(currentRowId, startRowId);
      const maxId = Math.max(currentRowId, startRowId);
      const rowIds = [];
      for (let id = minId; id <= maxId; id++) {
        rowIds.push(id);
      }
      this._rowIds = rowIds;
      selection.slots.databaseTableUpdated.emit({
        stage: 'move',
        rowIds,
        databaseId,
      });
    }
    selection.state.type = 'database';
  }

  onEnd(selection: DefaultSelectionManager, e: SelectionEvent) {
    console.log('end');
    selection.slots.databaseTableUpdated.emit({
      stage: 'end',
    });
    this._columnWidthHandles.forEach(handle => {
      handle.style.display = 'block';
    });
  }
}
