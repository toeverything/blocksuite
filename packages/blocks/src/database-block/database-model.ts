import type { MigrationRunner, Text } from '@blocksuite/store';
import { BaseBlockModel, defineBlockSchema, nanoid } from '@blocksuite/store';

import { getTagColor } from '../components/tags/colors.js';
import { selectPureColumnConfig } from './common/columns/select/define.js';
import { titlePureColumnConfig } from './common/columns/title/define.js';
import type { DataViewDataType, DataViewTypes } from './common/data-view.js';
import { viewManager } from './common/data-view.js';
import type { Column } from './table/types.js';
import type { Cell, ColumnUpdater, InsertPosition } from './types.js';
import { insertPositionToIndex } from './utils/insert.js';

type Props = {
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

export class DatabaseBlockModel extends BaseBlockModel<Props> {
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

  init(viewType: DataViewTypes) {
    const ids = [nanoid(), nanoid(), nanoid()];
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
    this.addColumn(
      'start',
      titlePureColumnConfig.create(titlePureColumnConfig.name)
    );
    this.addView(viewType);
    // By default, database has 3 empty rows
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
  }

  addView(type: DataViewTypes) {
    this.page.captureSync();
    const id = this.page.generateId();
    const viewConfig = viewManager.getView(type);
    const view = viewConfig.init(this, id, viewConfig.defaultName);
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
        this.cells[rowId][columnId] = {
          columnId,
          value,
        };
      });
    });
  }
}

const migration = {
  toV3: (data, previousVersion, latestVersion) => {
    const id = nanoid();
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
  props: (internal): Props => ({
    views: [],
    title: internal.Text(''),
    cells: {},
    columns: [],
  }),
  metadata: {
    role: 'hub',
    version: 3,
    parent: ['affine:note'],
    children: ['affine:paragraph', 'affine:list'],
  },
  toModel: () => {
    return new DatabaseBlockModel();
  },
  onUpgrade: (data, previousVersion, latestVersion) => {
    if (previousVersion < 3 && latestVersion >= 3) {
      migration.toV3(data, previousVersion, latestVersion);
    }
  },
});
