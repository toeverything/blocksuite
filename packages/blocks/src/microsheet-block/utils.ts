import type {
  Cell,
  Column,
  ColumnUpdater,
  MicrosheetBlockModel,
  ViewBasicDataType,
} from '@blocksuite/affine-model';
import type { BlockStdScope, TextSelection } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import {
  arrayMove,
  insertPositionToIndex,
  type InsertToPosition,
} from '@blocksuite/affine-shared/utils';
import { assertExists } from '@blocksuite/global/utils';

export function addProperty(
  model: MicrosheetBlockModel,
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
  model.children.forEach(item => {
    const cellContainerId = model.doc.addBlock('affine:cell', {}, item.id);
    model.doc.addBlock(
      'affine:paragraph',
      {
        text: new model.doc.Text(``),
      },
      cellContainerId
    );
    updateCell(model, item.id, {
      columnId: id,
      value: '',
      ref: cellContainerId,
    });
  });
  return id;
}

export function applyCellsUpdate(model: MicrosheetBlockModel) {
  model.doc.updateBlock(model, {
    cells: model.cells,
  });
}

export function applyPropertyUpdate(model: MicrosheetBlockModel) {
  model.doc.updateBlock(model, {
    columns: model.columns,
  });
}

export function applyViewsUpdate(model: MicrosheetBlockModel) {
  model.doc.updateBlock(model, {
    views: model.views,
  });
}

export function copyCellsByProperty(
  model: MicrosheetBlockModel,
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
  model: MicrosheetBlockModel,
  columnId: Column['id']
) {
  const index = findPropertyIndex(model, columnId);
  if (index < 0) return;

  model.doc.transact(() => {
    model.columns.splice(index, 1);
  });
}

export function deleteRows(model: MicrosheetBlockModel, rowIds: string[]) {
  model.doc.transact(() => {
    for (const rowId of rowIds) {
      delete model.cells[rowId];
    }
  });
}

export function deleteView(model: MicrosheetBlockModel, id: string) {
  model.doc.captureSync();
  model.doc.transact(() => {
    model.views = model.views.filter(v => v.id !== id);
  });
}

export function duplicateView(model: MicrosheetBlockModel, id: string): string {
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

export function findPropertyIndex(
  model: MicrosheetBlockModel,
  id: Column['id']
) {
  return model.columns.findIndex(v => v.id === id);
}

export function getCell(
  model: MicrosheetBlockModel,
  rowId: BlockModel['id'],
  columnId: Column['id']
): Cell | null {
  if (columnId === 'title') {
    return {
      columnId: 'title',
      value: rowId,
      ref: '',
    };
  }
  const yRow = model.cells$.value[rowId];
  const yCell = yRow?.[columnId] ?? null;
  if (!yCell) return null;

  return {
    ...yCell,
  };
}

export function getProperty(
  model: MicrosheetBlockModel,
  id: Column['id']
): Column | undefined {
  return model.columns.find(v => v.id === id);
}

export function moveViewTo(
  model: MicrosheetBlockModel,
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
  model: MicrosheetBlockModel,
  rowId: string,
  cell: Cell
) {
  const hasRow = rowId in model.cells;
  if (!hasRow) {
    model.cells[rowId] = Object.create(null);
  }
  model.doc.transact(() => {
    model.cells[rowId][cell.columnId] = {
      ...cell,
      // columnId: cell.columnId,
      // value: cell.value,
    };
  });
}

export function updateCells(
  model: MicrosheetBlockModel,
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

export function updateProperty(
  model: MicrosheetBlockModel,
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
  model: MicrosheetBlockModel,
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
export const MICROSHEET_CONVERT_WHITE_LIST = [
  'affine:list',
  'affine:paragraph',
];

const checkTypes = ['affine:paragraph', 'affine:list'];

export function getTheOnlyTextSelection(
  std: BlockStdScope
): TextSelection | null {
  const value = std.selection.value;
  if (value.length === 1 && value[0].type === 'text') {
    return value[0] as TextSelection;
  }

  return null;
}

export function isInCellStart(std: BlockStdScope, atTextStart = false) {
  const value = getTheOnlyTextSelection(std);
  const doc = std.doc;

  if (value) {
    const currentModel = doc.getBlockById(value.blockId);
    if (currentModel && checkTypes.includes(currentModel.flavour)) {
      const parentModel = doc.getParent(currentModel);
      if (
        parentModel?.flavour === 'affine:cell' &&
        parentModel.firstChild() === currentModel
      ) {
        if (!atTextStart) return true;
        return value.start.index === 0;
      }
    }
  }

  return false;
}

export function isInCellEnd(std: BlockStdScope, atTextEnd = false) {
  const value = getTheOnlyTextSelection(std);
  const doc = std.doc;

  if (value) {
    const currentModel = doc.getBlockById(value.blockId);
    if (currentModel && checkTypes.includes(currentModel.flavour)) {
      const parentModel = doc.getParent(currentModel);
      if (
        parentModel?.flavour === 'affine:cell' &&
        parentModel.lastChild() === currentModel
      ) {
        if (!atTextEnd) return true;
        const textLength = currentModel.text?.length;
        return textLength ? value.end.index === textLength : true;
      }
    }
  }

  return false;
}

export function calculateLineNum(std: BlockStdScope) {
  const value = getTheOnlyTextSelection(std);
  const doc = std.doc;
  assertExists(value);

  const currentModel = doc.getBlockById(value.blockId);
  const element = std.host.querySelector(
    `[data-block-id="${value.blockId}"] .inline-editor`
  );
  assertExists(element);

  const text = currentModel?.text?.toString().slice(0, value.start.index + 1);
  assertExists(text);

  const temp = document.createElement('div');
  temp.style.margin = '0';
  temp.style.padding = '0';
  // @ts-ignore
  temp.style.fontFamily = element.style.fontFamily;
  // @ts-ignore
  temp.style.fontSize = element.style.fontSize;
  temp.style.width = element.getBoundingClientRect().width + 'px';

  element.parentElement?.append(temp);
  temp.innerHTML = 'A';
  const lineHeight = temp.clientHeight;

  temp.innerHTML = text || 'A';
  const currentHeight = temp.clientHeight;
  temp?.remove();

  const lines = Math.floor(element.getBoundingClientRect().height / lineHeight);
  const line = Math.floor(currentHeight / lineHeight);

  return {
    isFirst: line <= 1,
    isLast: line >= lines,
  };
}
