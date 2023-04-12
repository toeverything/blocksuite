import type { Cell, Column, SelectTag } from '@blocksuite/global/database';
import { assertExists } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import type { BaseBlockModel } from '../base.js';
import type { Page } from './page.js';

type SerializedCells = {
  // row
  [key: string]: {
    // column
    [key: string]: Cell;
  };
};

export class DatabaseManager {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  protected get yCells() {
    // @ts-ignore
    assertExists(this.page.root?.cells);
    // @ts-ignore
    return this.page.root.cells as Y.Map<Y.Map<unknown>>;
  }

  protected get yColumns() {
    // @ts-ignore
    assertExists(this.page.root?.columns);
    // @ts-ignore
    return this.page.root.columns as Y.Map<unknown>;
  }

  get serializedCells(): SerializedCells {
    return this.yCells.toJSON();
  }

  getColumn(id: Column['id']): Column | null {
    return (this.yColumns.get(id) ?? null) as Column | null;
  }

  updateColumn(column: Omit<Column, 'id'> & { id?: Column['id'] }): string {
    const id = column.id ?? this.page.generateId();
    this.page.transact(() => this.yColumns.set(id, { ...column, id }));
    return id;
  }

  deleteColumn(columnId: Column['id']) {
    this.page.transact(() => this.yColumns.delete(columnId));
  }

  getCell(rowId: BaseBlockModel['id'], columnId: Column['id']): Cell | null {
    const yRow = this.yCells.get(rowId);
    const yCell = (yRow?.get(columnId) as Y.Map<unknown>) ?? null;
    if (!yCell) return null;

    return {
      columnId: yCell.get('columnId') as string,
      value: yCell.get('value') as unknown,
    };
  }

  updateCell(rowId: string, cell: Cell) {
    const hasRow = this.yCells.has(rowId);
    let yRow: Y.Map<unknown>;
    if (!hasRow) {
      yRow = new Y.Map();
    } else {
      yRow = this.yCells.get(rowId) as Y.Map<unknown>;
    }
    this.page.transact(() => {
      if (!hasRow) {
        this.yCells.set(rowId, yRow);
      }
      // Related issue: https://github.com/yjs/yjs/issues/255
      const yCell = new Y.Map();
      yCell.set('columnId', cell.columnId);
      yCell.set('value', cell.value);
      yRow.set(cell.columnId, yCell);
    });
  }

  copyCellsByColumn(fromId: Column['id'], toId: Column['id']) {
    this.page.transact(() => {
      this.yCells.forEach(yRow => {
        const yCell = yRow.get(fromId) as Y.Map<unknown>;
        if (yCell) {
          const yNewCell = new Y.Map();
          yNewCell.set('columnId', toId);
          yNewCell.set('value', yCell.get('value'));
          yRow.set(toId, yNewCell);
        }
      });
    });
  }

  deleteCellsByColumn(columnId: Column['id']) {
    this.page.transact(() => {
      this.yCells.forEach(yRow => yRow.delete(columnId));
    });
  }

  convertCellsByColumn(
    columnId: Column['id'],
    newType: 'select' | 'rich-text'
  ) {
    this.page.transact(() => {
      this.yCells.forEach(yRow => {
        const yCell = yRow.get(columnId) as Y.Map<unknown>;
        if (!yCell) return;

        if (newType === 'select') {
          const value = yCell.get('value');
          if (!value) return;

          const yNewCell = new Y.Map();
          yNewCell.set('columnId', columnId);
          yNewCell.set('value', [(value as string[])[0]]);
          yRow.set(columnId, yNewCell);
        } else if (newType === 'rich-text') {
          const value = yCell.get('value');
          if (!value) return;

          const yNewCell = new Y.Map();
          yNewCell.set('columnId', columnId);
          yNewCell.set('value', new Y.Text((value as number) + ''));
          yRow.set(columnId, yNewCell);
        }
      });
    });
  }

  renameSelectedCellTag(
    columnId: Column['id'],
    oldValue: SelectTag,
    newValue: SelectTag
  ) {
    this.page.transact(() => {
      this.yCells.forEach(yRow => {
        const yCell = yRow.get(columnId) as Y.Map<SelectTag[]>;
        if (!yCell) return;

        const selected = yCell.get('value') as SelectTag[];
        const newSelected = [...selected];
        const index = newSelected.indexOf(oldValue);
        newSelected[index] = newValue;

        const yNewCell = new Y.Map();
        yNewCell.set('columnId', columnId);
        yNewCell.set('value', newSelected);
        yRow.set(columnId, yNewCell);
      });
    });
  }

  deleteSelectedCellTag(columnId: Column['id'], target: SelectTag) {
    this.page.transact(() => {
      this.yCells.forEach(yRow => {
        const yCell = yRow.get(columnId) as Y.Map<SelectTag[]>;
        if (!yCell) return;

        const selected = yCell.get('value') as SelectTag[];
        let newSelected = [...selected];
        newSelected = selected.filter(item => item.value !== target.value);

        const yNewCell = new Y.Map();
        yNewCell.set('columnId', columnId);
        yNewCell.set('value', newSelected);
        yRow.set(columnId, yNewCell);
      });
    });
  }
}
