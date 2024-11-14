import type {
  Cell,
  Column,
  DatabaseBlockModel,
} from '@blocksuite/affine-model';
import type { BlockModel } from '@blocksuite/store';

import { Text } from '@blocksuite/store';

import { updateProps } from './block-utils.js';

export function duplicateCellsByProperty(
  model: DatabaseBlockModel,
  fromId: Column['id'],
  toId: Column['id']
) {
  updateProps(model, 'cells', cells => {
    Object.keys(cells).forEach(rowId => {
      const cell = cells[rowId][fromId];
      if (cell) {
        cells[rowId][toId] = {
          ...cell,
          columnId: toId,
        };
      }
    });
  });
}

export function deleteRows(model: DatabaseBlockModel, rowIds: string[]) {
  updateProps(model, 'cells', cells => {
    for (const rowId of rowIds) {
      delete cells[rowId];
    }
  });
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

export function updateCell(
  model: DatabaseBlockModel,
  rowId: string,
  cell: Cell
) {
  if (cell.value instanceof Text) {
    model.doc.transact(() => {
      const cells = model.cells;
      if (!cells[rowId]) {
        cells[rowId] = Object.create(null);
      }
      cells[rowId][cell.columnId] = cell;
    });
    model.columns$.value = [...model.columns$.value];
    return;
  }

  updateProps(model, 'cells', cells => {
    if (!cells[rowId]) {
      cells[rowId] = Object.create(null);
    }
    cells[rowId][cell.columnId] = cell;
  });
}

export function updateCells(
  model: DatabaseBlockModel,
  columnId: string,
  cells: Record<string, unknown>
) {
  updateProps(model, 'cells', modelCells => {
    Object.entries(cells).forEach(([rowId, value]) => {
      if (!modelCells[rowId]) {
        modelCells[rowId] = Object.create(null);
      }
      modelCells[rowId][columnId] = {
        columnId,
        value,
      };
    });
  });
}
