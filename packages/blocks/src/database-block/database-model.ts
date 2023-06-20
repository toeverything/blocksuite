import { BaseBlockModel, defineBlockSchema, Text } from '@blocksuite/store';

import type {
  DatabaseViewData,
  DatabaseViewDataMap,
} from './common/view-manager.js';
import { ViewOperationMap } from './common/view-manager.js';
import { DEFAULT_TITLE } from './table/consts.js';
import type { Cell, Column, SelectTag } from './table/types.js';

export type Props = {
  views: DatabaseViewData[];
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
export type ColumnUpdater<T extends Column = Column> = (data: T) => Partial<T>;
export type ColumnDataUpdater<
  Data extends Record<string, unknown> = Record<string, unknown>
> = (data: Data) => Partial<Data>;
export type InsertPosition =
  | string
  | 'end'
  | 'start'
  | { id: string; before: boolean };
export const insertPositionToIndex = <T extends { id: string }>(
  position: InsertPosition,
  arr: T[]
): number => {
  if (typeof position === 'object') {
    const index = arr.findIndex(v => v.id === position.id);
    return index + (position.before ? 0 : 1);
  }
  if (position == null || position === 'start') {
    return 0;
  }
  if (position === 'end') {
    return arr.length;
  }
  return arr.findIndex(v => v.id === position) + 1;
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

    if (!this.views.length) {
      this.addView('table');
    }
  }

  getViewList() {
    return this.views;
  }

  addView(type: keyof DatabaseViewDataMap) {
    this.page.captureSync();
    const id = this.page.generateId();
    const view = ViewOperationMap[type].init(this, id, type);
    this.page.transact(() => {
      this.views.push(view);
    });
    return view;
  }

  deleteView(id: string) {
    this.page.captureSync();
    this.page.transact(() => {
      this.views = this.views.filter(v => v.id !== id);
    });
  }

  updateView<Type extends keyof DatabaseViewDataMap>(
    id: string,
    type: Type,
    update: (data: DatabaseViewDataMap[Type]) => void
  ) {
    this.page.transact(() => {
      this.views.map(v => {
        if (v.id !== id || v.mode !== type) {
          return v;
        }
        return update(v as DatabaseViewDataMap[Type]);
      });
    });
  }

  applyViewsUpdate() {
    this.page.updateBlock(this, {
      views: this.views,
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
    return this.columns.findIndex(v => v.id === id);
  }

  getColumn(id: Column['id']): Column | null {
    const index = this.findColumnIndex(id);
    if (index < 0) {
      return null;
    }
    return this.columns[index];
  }

  addColumn(
    position: InsertPosition,
    column: Omit<Column, 'id'> & { id?: string }
  ): string {
    const id = column.id ?? this.page.generateId();
    this.page.transact(() => {
      const col = { ...column, id };
      this.columns.splice(
        insertPositionToIndex(position, this.columns),
        0,
        col
      );
      this.views.forEach(view => {
        ViewOperationMap[view.mode].addColumn(
          this,
          view as never,
          col,
          position
        );
      });
    });
    return id;
  }

  updateColumn(id: string, updater: ColumnUpdater) {
    const index = this.columns.findIndex(v => v.id === id);
    if (index == null) {
      return;
    }
    this.page.transact(() => {
      const column = this.columns[index];
      this.columns[index] = { ...column, ...updater(column) };
    });
    return id;
  }

  updateColumnData(id: string, update: ColumnDataUpdater) {
    this.page.transact(() => {
      const i = this.findColumnIndex(id);
      const data = this.columns[i].data;
      this.columns[i].data = {
        ...data,
        ...update(data),
      };
    });
  }

  deleteColumn(columnId: Column['id']) {
    const index = this.findColumnIndex(columnId);
    if (index < 0) return;

    this.page.transact(() => {
      this.columns.splice(index, 1);
      this.views.forEach(view => {
        ViewOperationMap[view.mode].deleteColumn(this, view as never, columnId);
      });
    });
  }

  getCell(rowId: BaseBlockModel['id'], columnId: Column['id']): Cell | null {
    if (columnId === 'title') {
      return { columnId: 'title', value: rowId };
    }
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

  convertCellsByColumn(columnId: Column['id'], newType: string) {
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

  updateCellByColumn(columnId: string, update: (value: unknown) => unknown) {
    this.page.transact(() => {
      Object.keys(this.cells).forEach(rowId => {
        const cell = this.cells[rowId][columnId];
        if (!cell) {
          return;
        }
        this.cells[rowId][columnId] = {
          columnId,
          value: update(cell.value),
        };
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
    views: [],
    title: internal.Text(DEFAULT_TITLE),
    cells: {},
    columns: [],
    titleColumnName: 'Title',
    titleColumnWidth: 432,
  }),
  metadata: {
    role: 'hub',
    version: 2,
    parent: ['affine:note'],
    children: ['affine:paragraph', 'affine:list'],
  },
  toModel: () => {
    return new DatabaseBlockModel();
  },
});
