import { Text } from '@blocksuite/store';
import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import type { Cell, Column, SelectTag } from './types.js';

export type Props = {
  title: Text;
  cells: SerializedCells;
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
          event.path.includes('prop:cells'))
      ) {
        this.propsUpdated.emit();
      }
    });
  }

  applyColumnUpdate() {
    this.page.updateBlock(this, {
      columns: this.columns,
    });
  }

  applyCellsUpdate() {
    this.page.updateBlock(this, {
      cells: this.cells,
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
    const yRow = this.cells[rowId];
    const yCell = yRow?.[columnId] ?? null;
    if (!yCell) return null;

    return {
      columnId: yCell.columnId,
      value: yCell.value,
    };
  }

  updateCell(rowId: string, cell: Cell) {
    const hasRow = rowId in this.cells;
    if (!hasRow) {
      this.cells[rowId] = {};
    }
    this.page.transact(() => {
      this.cells[rowId][cell.columnId] = {
        columnId: cell.columnId,
        value: cell.value,
      };
    });
  }

  copyCellsByColumn(fromId: Column['id'], toId: Column['id']) {
    this.page.transact(() => {
      Object.keys(this.cells).forEach(rowId => {
        const cell = this.cells[rowId][fromId];
        if (cell) {
          this.cells[rowId][toId] = {
            ...cell,
            columnId: toId,
          };
        }
      });
    });
  }

  deleteCellsByColumn(columnId: Column['id']) {
    this.page.transact(() => {
      Object.keys(this.cells).forEach(rowId => {
        delete this.cells[rowId][columnId];
      });
    });
  }

  convertCellsByColumn(
    columnId: Column['id'],
    newType: 'select' | 'rich-text'
  ) {
    this.page.transact(() => {
      Object.keys(this.cells).forEach(rowId => {
        const cell = this.cells[rowId][columnId];
        if (!cell) return;

        const value = cell.value;
        if (!value) return;

        if (newType === 'select') {
          this.cells[rowId][columnId] = {
            columnId,
            value: [(value as string[])[0]],
          };
          return;
        }

        if (newType === 'rich-text') {
          const text = new Text((value as number) + '');
          this.cells[rowId][columnId] = {
            columnId,
            value: text.yText,
          };
          return;
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
      Object.keys(this.cells).forEach(rowId => {
        const cell = this.cells[rowId][columnId];
        if (!cell) return;

        const selected = cell.value as SelectTag[];
        const newSelected = [...selected];
        const index = newSelected.findIndex(s => s.value === oldValue.value);
        newSelected[index] = newValue;

        this.cells[rowId][columnId].value = newSelected;
      });
    });
  }

  deleteSelectedCellTag(columnId: Column['id'], target: SelectTag) {
    this.page.transact(() => {
      Object.keys(this.cells).forEach(rowId => {
        const cell = this.cells[rowId][columnId];
        if (!cell) return;

        const selected = cell.value as SelectTag[];
        const newSelected = [...selected].filter(
          item => item.value !== target.value
        );

        this.cells[rowId][columnId] = {
          columnId,
          value: newSelected,
        };
      });
    });
  }
}

export const DatabaseBlockSchema = defineBlockSchema({
  flavour: 'affine:database',
  props: (internal): Props => ({
    title: internal.Text(),
    cells: {},
    columns: [],
    titleColumnName: 'Title',
    titleColumnWidth: 432,
  }),
  metadata: {
    role: 'hub',
    version: 1,
    tag: literal`affine-database`,
    parent: ['affine:frame'],
    children: ['affine:paragraph', 'affine:list'],
  },
  toModel: () => {
    return new DatabaseBlockModel();
  },
});
