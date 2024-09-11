import type {
  Cell,
  Column,
  ColumnUpdater,
  DatabaseBlockModel,
  ViewBasicDataType,
} from '@blocksuite/affine-model';
import type { EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import {
  arrayMove,
  insertPositionToIndex,
  type InsertToPosition,
} from '@blocksuite/affine-shared/utils';
import { getTagColor, type ViewMeta } from '@blocksuite/data-view';
import { columnPresets } from '@blocksuite/data-view/column-presets';
import { nanoid } from '@blocksuite/store';

import { titlePureColumnConfig } from './columns/title/define.js';
import { DatabaseBlockDataSource } from './data-source.js';

export const databaseViewInitEmpty = (
  host: EditorHost,
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  addColumn(
    model,
    'start',
    titlePureColumnConfig.create(titlePureColumnConfig.config.name)
  );
  databaseViewAddView(host, model, viewMeta);
};

export const databaseViewInitConvert = (
  host: EditorHost,
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  addColumn(
    model,
    'end',
    columnPresets.multiSelectColumnConfig.create('Tag', { options: [] })
  );
  databaseViewInitEmpty(host, model, viewMeta);
};

export const databaseViewInitTemplate = (
  host: EditorHost,
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
  databaseViewInitEmpty(host, model, viewMeta);
};

export const databaseViewAddView = (
  host: EditorHost,
  model: DatabaseBlockModel,
  viewMeta: ViewMeta
) => {
  const dataSource = new DatabaseBlockDataSource(host, {
    pageId: model.doc.id,
    blockId: model.id,
  });
  dataSource.viewManager.viewAdd(viewMeta.type);
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
export const convertToDatabase = (host: EditorHost, viewMeta: ViewMeta) => {
  const [_, ctx] = host.std.command
    .chain()
    .getSelectedModels({
      types: ['block', 'text'],
    })
    .run();
  const { selectedModels } = ctx;
  if (!selectedModels || selectedModels.length === 0) return;

  host.doc.captureSync();

  const parentModel = host.doc.getParent(selectedModels[0]);
  if (!parentModel) {
    return;
  }

  const id = host.doc.addBlock(
    'affine:database',
    {},
    parentModel,
    parentModel.children.indexOf(selectedModels[0])
  );
  const databaseModel = host.doc.getBlock(id)?.model as
    | DatabaseBlockModel
    | undefined;
  if (!databaseModel) {
    return;
  }
  databaseViewInitConvert(host, databaseModel, viewMeta);
  applyColumnUpdate(databaseModel);
  host.doc.moveBlocks(selectedModels, databaseModel);

  const selectionManager = host.selection;
  selectionManager.clear();
};
export const DATABASE_CONVERT_WHITE_LIST = ['affine:list', 'affine:paragraph'];
