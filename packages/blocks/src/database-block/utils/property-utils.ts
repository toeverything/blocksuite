import type {
  Column,
  ColumnUpdater,
  DatabaseBlockModel,
} from '@blocksuite/affine-model';

import {
  insertPositionToIndex,
  type InsertToPosition,
} from '@blocksuite/affine-shared/utils';

import { updateProps } from './block-utils.js';

export function addProperty(
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
  updateProps(model, 'columns', columns => {
    const col: Column = {
      ...column,
      id,
    };
    columns.splice(insertPositionToIndex(position, columns), 0, col);
  });
  return id;
}

export function deleteProperty(
  model: DatabaseBlockModel,
  columnId: Column['id']
) {
  const index = findPropertyIndex(model, columnId);
  if (index < 0) return;
  updateProps(model, 'columns', columns => {
    columns.splice(index, 1);
  });
}

export function findPropertyIndex(model: DatabaseBlockModel, id: Column['id']) {
  return model.columns.findIndex(v => v.id === id);
}

export function getProperty(
  model: DatabaseBlockModel,
  id: Column['id']
): Column | undefined {
  return model.columns.find(v => v.id === id);
}

export function updateProperty(
  model: DatabaseBlockModel,
  id: string,
  updater: ColumnUpdater
) {
  const index = model.columns.findIndex(v => v.id === id);
  if (index == null) {
    return;
  }
  updateProps(model, 'columns', columns => {
    const column = columns[index];
    const result = updater(column);
    Object.assign(column, result);
  });
  return id;
}
