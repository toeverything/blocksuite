import type { MigrationRunner, Text } from '@blocksuite/store';
import { BaseBlockModel, defineBlockSchema, nanoid } from '@blocksuite/store';

import { getTagColor } from '../_common/components/tags/colors.js';
import { multiSelectPureColumnConfig } from './common/columns/multi-select/define.js';
import { selectPureColumnConfig } from './common/columns/select/define.js';
import { titlePureColumnConfig } from './common/columns/title/define.js';
import type { DataViewDataType, DataViewTypes } from './common/data-view.js';
import { viewManager } from './common/data-view.js';
import type { Column } from './table/types.js';
import type { Cell, ColumnUpdater, InsertToPosition } from './types.js';
import { arrayMove, insertPositionToIndex } from './utils/insert.js';

export type DatabaseBlockProps = {
  views: DataViewDataType[];
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

export class DatabaseBlockModel extends BaseBlockModel<DatabaseBlockProps> {
  getViewList() {
    return this.views;
  }

  initEmpty(viewType: DataViewTypes) {
    this.addColumn(
      'start',
      titlePureColumnConfig.create(titlePureColumnConfig.name)
    );
    this.addView(viewType);
  }

  initConvert(viewType: DataViewTypes) {
    this.addColumn(
      'end',
      multiSelectPureColumnConfig.create('Tag', { options: [] })
    );
    this.initEmpty(viewType);
  }

  initTemplate(viewType: DataViewTypes) {
    const ids = [nanoid('unknown'), nanoid('unknown'), nanoid('unknown')];
    const statusId = this.addColumn(
      'end',
      selectPureColumnConfig.create('Status', {
        options: [
          {
            id: ids[0],
            color: getTagColor(),
            value: 'TODO',
          },
          {
            id: ids[1],
            color: getTagColor(),
            value: 'In Progress',
          },
          {
            id: ids[2],
            color: getTagColor(),
            value: 'Done',
          },
        ],
      })
    );
    for (let i = 0; i < 4; i++) {
      const rowId = this.page.addBlock(
        'affine:paragraph',
        {
          text: new this.page.Text(`Task ${i + 1}`),
        },
        this.id
      );
      this.updateCell(rowId, {
        columnId: statusId,
        value: ids[i],
      });
    }
    this.initEmpty(viewType);
  }

  addView(type: DataViewTypes) {
    const id = this.page.generateBlockId();
    const viewConfig = viewManager.getView(type);
    const view = viewConfig.init(this, id, viewConfig.defaultName);
    this.page.transact(() => {
      this.views.push(view);
    });
    return view;
  }
  duplicateView(id: string): string {
    const newId = this.page.generateBlockId();
    this.page.transact(() => {
      const index = this.views.findIndex(v => v.id === id);
      const view = this.views[index];
      if (view) {
        this.views.splice(
          index + 1,
          0,
          JSON.parse(JSON.stringify({ ...view, id: newId }))
        );
      }
    });
    return newId;
  }

  deleteView(id: string) {
    this.page.captureSync();
    this.page.transact(() => {
      this.views = this.views.filter(v => v.id !== id);
    });
  }

  updateView(
    id: string,
    update: (data: DataViewDataType) => Partial<DataViewDataType>
  ) {
    this.page.transact(() => {
      this.views = this.views.map(v => {
        if (v.id !== id) {
          return v;
        }
        return { ...v, ...update(v) } as DataViewDataType;
      });
    });
    this.applyViewsUpdate();
  }
  moveViewTo(id: string, position: InsertToPosition) {
    this.page.transact(() => {
      this.views = arrayMove(
        this.views,
        v => v.id === id,
        arr => insertPositionToIndex(position, arr)
      );
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

  findColumnIndex(id: Column['id']) {
    return this.columns.findIndex(v => v.id === id);
  }

  getColumn(id: Column['id']): Column | undefined {
    return this.columns.find(v => v.id === id);
  }

  addColumn(
    position: InsertToPosition,
    column: Omit<Column, 'id'> & {
      id?: string;
    }
  ): string {
    const id = column.id ?? this.page.generateBlockId();
    if (this.columns.find(v => v.id === id)) {
      return id;
    }
    this.page.transact(() => {
      const col = {
        ...column,
        id,
      };
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
      return {
        columnId: 'title',
        value: rowId,
      };
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
    if (rowId === '__proto__') {
      return;
    }
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
        if (rowId === '__proto__') {
          return;
        }
        this.cells[rowId][columnId] = {
          columnId,
          value,
        };
      });
    });
  }
}

const migration = {
  toV3: data => {
    const id = nanoid('unknown');
    // @ts-expect-error
    const title = data['titleColumnName'];
    // @ts-expect-error
    const width = data['titleColumnWidth'];
    // @ts-expect-error
    delete data['titleColumnName'];
    // @ts-expect-error
    delete data['titleColumnWidth'];
    data.columns.unshift({
      id,
      type: 'title',
      name: title,
      data: {},
    });
    data.views.forEach(view => {
      if (view.mode === 'table') {
        view.columns.unshift({
          id,
          width,
        });
      }
    });
  },
} satisfies Record<string, MigrationRunner<typeof DatabaseBlockSchema>>;

export const DatabaseBlockSchema = defineBlockSchema({
  flavour: 'affine:database',
  props: (internal): DatabaseBlockProps => ({
    views: [],
    title: internal.Text(),
    cells: {},
    columns: [],
  }),
  metadata: {
    role: 'hub',
    version: 3,
    parent: ['affine:note'],
    children: ['affine:paragraph', 'affine:list'],
  },
  toModel: () => new DatabaseBlockModel(),
  onUpgrade: (data, previousVersion, latestVersion) => {
    if (previousVersion < 3 && latestVersion >= 3) {
      migration.toV3(data);
    }
  },
});
