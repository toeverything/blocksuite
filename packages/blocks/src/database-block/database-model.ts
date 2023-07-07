import type { Text } from '@blocksuite/store';
import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { copyBlocks } from '../__internal__/clipboard/index.js';
import type {
  DatabaseViewData,
  DatabaseViewDataMap,
} from './common/view-manager.js';
import { ViewOperationMap } from './common/view-manager.js';
import { DEFAULT_TITLE } from './table/consts.js';
import type { Cell, Column } from './table/types.js';

type Props = {
  views: DatabaseViewData[];
  title: Text;
  cells: SerializedCells;
  columns: Array<Column>;
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
  | 'end'
  | 'start'
  | {
      id: string;
      before: boolean;
    };
export const insertPositionToIndex = <
  T extends {
    id: string;
  }
>(
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
export type BlockOperation = {
  copy: () => void;
  delete: () => void;
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
    if (!this.columns.find(v => v.id === this.id)) {
      this.columns.unshift({
        type: 'title',
        id: this.id,
        name: 'Title',
        data: {},
      });
    }
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

  updateView(
    id: string,
    update: (data: DatabaseViewData) => Partial<DatabaseViewData>
  ) {
    this.page.transact(() => {
      this.views = this.views.map(v => {
        if (v.id !== id) {
          return v;
        }
        return { ...v, ...update(v) } as DatabaseViewData;
      });
    });
    this.applyViewsUpdate();
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

  getColumn(id: Column['id']): Column | undefined {
    return this.columns.find(v => v.id === id);
  }

  addColumn(
    position: InsertPosition,
    column: Omit<Column, 'id'> & {
      id?: string;
    }
  ): string {
    const id = column.id ?? this.page.generateId();
    if (this.columns.find(v => v.id === id)) {
      return id;
    }
    this.page.transact(() => {
      const col = { ...column, id };
      this.columns.splice(
        insertPositionToIndex(position, this.columns),
        0,
        col
      );
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

  deleteColumn(columnId: Column['id']) {
    const index = this.findColumnIndex(columnId);
    if (index < 0) return;

    this.page.transact(() => {
      this.columns.splice(index, 1);
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

  updateCells(columnId: string, cells: Record<string, unknown>) {
    this.page.transact(() => {
      Object.entries(cells).forEach(([rowId, value]) => {
        this.cells[rowId][columnId] = { columnId, value };
      });
    });
  }

  copy = () => {
    copyBlocks({
      type: 'Block',
      models: [this],
      startOffset: 0,
      endOffset: 0,
    });
  };
  delete = () => {
    const models = [this, ...this.children];
    models.forEach(model => this.page.deleteBlock(model));
  };
}

export const DatabaseBlockSchema = defineBlockSchema({
  flavour: 'affine:database',
  props: (internal): Props => ({
    views: [],
    title: internal.Text(DEFAULT_TITLE),
    cells: {},
    columns: [],
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
