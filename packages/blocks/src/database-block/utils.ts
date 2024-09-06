import type {
  Cell,
  Column,
  ColumnUpdater,
  DatabaseBlockModel,
  ViewBasicDataType,
} from '@blocksuite/affine-model';
import type { BlockModel } from '@blocksuite/store';

import {
  arrayMove,
  insertPositionToIndex,
  type InsertToPosition,
} from '@blocksuite/affine-shared/utils';
import {
  type ColumnMeta,
  type DataViewDataType,
  type DataViewTypes,
  defaultGroupBy,
  getTagColor,
  groupByMatcher,
  type ViewMeta,
} from '@blocksuite/data-view';
import { columnPresets } from '@blocksuite/data-view/column-presets';
import { columnModelPresets } from '@blocksuite/data-view/column-pure-presets';
import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { nanoid } from '@blocksuite/store';

import { databaseBlockAllColumnMap } from './columns/index.js';
import { titlePureColumnConfig } from './columns/title/define.js';

const initMap: Record<
  DataViewTypes,
  (
    columnMetaMap: Record<string, ColumnMeta>,
    model: DatabaseBlockModel,
    id: string,
    name: string
  ) => DataViewDataType
> = {
  table(_columnMetaMap, model, id, name) {
    return {
      id,
      name,
      mode: 'table',
      columns: [],
      filter: {
        type: 'group',
        op: 'and',
        conditions: [],
      },
      header: {
        titleColumn: model.columns.find(v => v.type === 'title')?.id,
        iconColumn: 'type',
      },
    };
  },
  kanban(columnMetaMap, model, id, name) {
    const allowList = model.columns.filter(column => {
      const type = columnMetaMap[column.type].config.type(column.data);
      return !!groupByMatcher.match(type) && column.type !== 'title';
    });
    const getWeight = (column: Column) => {
      if (
        [
          columnModelPresets.multiSelectColumnModelConfig.type,
          columnModelPresets.selectColumnModelConfig.type as string,
        ].includes(column.type)
      ) {
        return 3;
      }
      if (
        [
          columnModelPresets.numberColumnModelConfig.type as string,
          columnModelPresets.textColumnModelConfig.type,
        ].includes(column.type)
      ) {
        return 2;
      }
      return 1;
    };
    const column = allowList.sort((a, b) => getWeight(b) - getWeight(a))[0];
    if (!column) {
      throw new BlockSuiteError(
        ErrorCode.DatabaseBlockError,
        'not implement yet'
      );
    }
    return {
      id,
      name,
      mode: 'kanban',
      columns: model.columns.map(v => ({
        id: v.id,
        hide: false,
      })),
      filter: {
        type: 'group',
        op: 'and',
        conditions: [],
      },
      groupBy: defaultGroupBy(
        columnMetaMap[column.type],
        column.id,
        column.data
      ),
      header: {
        titleColumn: model.columns.find(v => v.type === 'title')?.id,
        iconColumn: 'type',
      },
      groupProperties: [],
    };
  },
};
export const databaseViewInitEmpty = (
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  addColumn(
    model,
    'start',
    titlePureColumnConfig.create(titlePureColumnConfig.config.name)
  );
  databaseViewAddView(model, viewMeta);
};

export const databaseViewInitConvert = (
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  addColumn(
    model,
    'end',
    columnPresets.multiSelectColumnConfig.create('Tag', { options: [] })
  );
  databaseViewInitEmpty(model, viewMeta);
};

export const databaseViewInitTemplate = (
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  const ids = [nanoid(), nanoid(), nanoid()];
  const statusId = addColumn(
    model,
    'end',
    columnPresets.selectColumnConfig.create('Status', {
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
    const rowId = model.doc.addBlock(
      'affine:paragraph',
      {
        text: new model.doc.Text(`Task ${i + 1}`),
      },
      model.id
    );
    updateCell(model, rowId, {
      columnId: statusId,
      value: ids[i],
    });
  }
  databaseViewInitEmpty(model, viewMeta);
};

export const databaseViewAddView = (
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  const id = model.doc.generateBlockId();
  const view = initMap[viewMeta.type](
    databaseBlockAllColumnMap,
    model,
    id,
    viewMeta.model.defaultName
  );
  model.doc.transact(() => {
    model.views = [...model.views, view];
  });
  return view;
};

export function addColumn(
  model: DatabaseBlockModel,
  position: InsertToPosition,
  column: Omit<Column, 'id'> & {
    id?: string;
  }
): string {
  const id = column.id ?? model.doc.generateBlockId();
  if (model.columns.some(v => v.id === id)) {
    return id;
  }
  model.doc.transact(() => {
    const col: Column = {
      ...column,
      id,
    };
    model.columns.splice(
      insertPositionToIndex(position, model.columns),
      0,
      col
    );
  });
  return id;
}

export function applyCellsUpdate(model: DatabaseBlockModel) {
  model.doc.updateBlock(model, {
    cells: model.cells,
  });
}

export function applyColumnUpdate(model: DatabaseBlockModel) {
  model.doc.updateBlock(model, {
    columns: model.columns,
  });
}

export function applyViewsUpdate(model: DatabaseBlockModel) {
  model.doc.updateBlock(model, {
    views: model.views,
  });
}

export function copyCellsByColumn(
  model: DatabaseBlockModel,
  fromId: Column['id'],
  toId: Column['id']
) {
  model.doc.transact(() => {
    Object.keys(model.cells).forEach(rowId => {
      const cell = model.cells[rowId][fromId];
      if (cell) {
        model.cells[rowId][toId] = {
          ...cell,
          columnId: toId,
        };
      }
    });
  });
}

export function deleteColumn(
  model: DatabaseBlockModel,
  columnId: Column['id']
) {
  const index = findColumnIndex(model, columnId);
  if (index < 0) return;

  model.doc.transact(() => {
    model.columns.splice(index, 1);
  });
}

export function deleteRows(model: DatabaseBlockModel, rowIds: string[]) {
  model.doc.transact(() => {
    for (const rowId of rowIds) {
      delete model.cells[rowId];
    }
  });
}

export function deleteView(model: DatabaseBlockModel, id: string) {
  model.doc.captureSync();
  model.doc.transact(() => {
    model.views = model.views.filter(v => v.id !== id);
  });
}

export function duplicateView(model: DatabaseBlockModel, id: string): string {
  const newId = model.doc.generateBlockId();
  model.doc.transact(() => {
    const index = model.views.findIndex(v => v.id === id);
    const view = model.views[index];
    if (view) {
      model.views.splice(
        index + 1,
        0,
        JSON.parse(JSON.stringify({ ...view, id: newId }))
      );
    }
  });
  return newId;
}

export function findColumnIndex(model: DatabaseBlockModel, id: Column['id']) {
  return model.columns.findIndex(v => v.id === id);
}

export function getCell(
  model: DatabaseBlockModel,
  rowId: BlockModel['id'],
  columnId: Column['id']
): Cell | null {
  if (columnId === 'title') {
    return {
      columnId: 'title',
      value: rowId,
    };
  }
  const yRow = model.cells$.value[rowId];
  const yCell = yRow?.[columnId] ?? null;
  if (!yCell) return null;

  return {
    columnId: yCell.columnId,
    value: yCell.value,
  };
}

export function getColumn(
  model: DatabaseBlockModel,
  id: Column['id']
): Column | undefined {
  return model.columns.find(v => v.id === id);
}

export function moveViewTo(
  model: DatabaseBlockModel,
  id: string,
  position: InsertToPosition
) {
  model.doc.transact(() => {
    model.views = arrayMove(
      model.views,
      v => v.id === id,
      arr => insertPositionToIndex(position, arr)
    );
  });
  applyViewsUpdate(model);
}

export function updateCell(
  model: DatabaseBlockModel,
  rowId: string,
  cell: Cell
) {
  const hasRow = rowId in model.cells;
  if (!hasRow) {
    model.cells[rowId] = Object.create(null);
  }
  model.doc.transact(() => {
    model.cells[rowId][cell.columnId] = {
      columnId: cell.columnId,
      value: cell.value,
    };
  });
}

export function updateCells(
  model: DatabaseBlockModel,
  columnId: string,
  cells: Record<string, unknown>
) {
  model.doc.transact(() => {
    Object.entries(cells).forEach(([rowId, value]) => {
      if (!model.cells[rowId]) {
        model.cells[rowId] = Object.create(null);
      }
      model.cells[rowId][columnId] = {
        columnId,
        value,
      };
    });
  });
}

export function updateColumn(
  model: DatabaseBlockModel,
  id: string,
  updater: ColumnUpdater
) {
  const index = model.columns.findIndex(v => v.id === id);
  if (index == null) {
    return;
  }
  model.doc.transact(() => {
    const column = model.columns[index];
    const result = updater(column);
    model.columns[index] = { ...column, ...result };
  });
  return id;
}

export const updateView = <ViewData extends ViewBasicDataType>(
  model: DatabaseBlockModel,
  id: string,
  update: (data: ViewData) => Partial<ViewData>
) => {
  model.doc.transact(() => {
    model.views = model.views.map(v => {
      if (v.id !== id) {
        return v;
      }
      return { ...v, ...update(v as ViewData) };
    });
  });
  applyViewsUpdate(model);
};
