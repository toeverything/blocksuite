import type { Cell, Column, SelectTag } from '@blocksuite/global/database';
import type { Text } from '@blocksuite/store';
import { BaseBlockModel, defineBlockSchema, Y } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export type Props = {
  title: Text;
  yCells: Y.Map<Y.Map<unknown>>;
  columns: Array<Column>;
  titleColumnName: string;
  titleColumnWidth: number;
};

type SerializedCells = {
  // row
  [key: string]: {
    // column
    [key: string]: Cell;
  };
};

export class DatabaseBlockModel extends BaseBlockModel<Props> {
  override onCreated() {
    super.onCreated();

    this.page.slots.onYEvent.on(({ event }) => {
      if (
        event.path.includes(this.id) &&
        (event.path.includes('prop:columns') ||
          event.path.includes('prop:yCells'))
      ) {
        this.propsUpdated.emit();
      }
    });
  }

  get serializedCells(): SerializedCells {
    return this.yCells.toJSON();
  }

  applyColumnUpdate() {
    this.page.updateBlock(this, {
      columns: this.columns,
    });
  }

  findColumnIndex(id: Column['id']) {
    let result = -1;
    this.columns.forEach((col, index) => {
      if (col.id === id) result = index;
    });
    return result;
  }

  getColumn(id: Column['id']): Column | null {
    const index = this.findColumnIndex(id);
    if (index < 0) {
      return null;
    }
    return this.columns[index];
  }

  addColumn(column: Omit<Column, 'id'>, index?: number): string {
    const id = this.page.generateId();
    this.page.transact(() => {
      const col = { ...column, id } as Column;
      if (index === undefined) {
        this.columns.push(col);
      } else {
        this.columns.splice(index, 0, col);
      }
    });
    return id;
  }

  updateColumn(column: Omit<Column, 'id'> & { id?: Column['id'] }): string {
    const id = column.id ?? this.page.generateId();
    const index = this.findColumnIndex(id);
    this.page.transact(() => {
      if (index < 0) {
        this.columns.push({ ...column, id } as Column);
      } else {
        this.columns[index] = { ...column, id } as Column;
      }
    });
    return id;
  }

  moveColumn(from: number, to: number) {
    this.page.transact(() => {
      const column = this.columns[from];
      this.columns.splice(from, 1);
      this.columns.splice(to, 0, column);
    });
  }

  deleteColumn(columnId: Column['id']) {
    const index = this.findColumnIndex(columnId);
    if (index < 0) return;

    this.page.transact(() => this.columns.splice(index, 1));
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

export const DatabaseBlockSchema = defineBlockSchema({
  flavour: 'affine:database',
  props: (internal): Props => ({
    title: internal.Text(),
    yCells: internal.Map<Y.Map<unknown>>(),
    columns: [],
    titleColumnName: 'Title',
    titleColumnWidth: 432,
  }),
  metadata: {
    role: 'hub',
    version: 1,
    tag: literal`affine-database`,
  },
  toModel: () => {
    return new DatabaseBlockModel();
  },
});
