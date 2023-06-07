import { assertExists } from '@blocksuite/store';

import { columnManager } from '../../../common/column-manager.js';
import type { DatabaseBlockModel } from '../../../database-model.js';
import type { Column, ColumnActionType, ColumnType } from '../../types.js';
import { ColumnInsertPosition } from '../../types.js';

export function changeColumnType(
  columnId: string,
  targetType: ColumnType,
  targetColumn: Column | string,
  targetModel: DatabaseBlockModel
) {
  if (isTitleColumn(targetColumn)) return;
  const currentType = targetColumn.type;
  targetModel.page.captureSync();
  const [newColumnData, update] =
    columnManager.convertCell(currentType, targetType, targetColumn.data) ?? [];
  if (!update) {
    const newColumn = columnManager.create(targetType, targetColumn.name);
    updateColumn(columnId, newColumn, targetModel);
    targetModel.updateCellByColumn(columnId, () => undefined);
  } else {
    updateColumn(
      columnId,
      { type: targetType, data: newColumnData },
      targetModel
    );
    targetModel.updateCellByColumn(columnId, update);
  }
}

export function onActionClick(
  actionType: ColumnActionType,
  columnId: string,
  targetModel: DatabaseBlockModel,
  columnIndex: number,
  setTitleColumnEditId: (columnId: string) => void,
  insertColumn: (position: ColumnInsertPosition) => void
) {
  if (actionType === 'rename') {
    setTitleColumnEditId(columnId);
    return;
  }
  if (actionType === 'insert-right' || actionType === 'insert-left') {
    if (actionType === 'insert-right') {
      insertColumn(ColumnInsertPosition.Right);
    } else {
      insertColumn(ColumnInsertPosition.Left);
    }
    return;
  }

  if (actionType === 'delete') {
    targetModel.page.captureSync();
    targetModel.deleteColumn(columnId);
    targetModel.deleteCellsByColumn(columnId);
    targetModel.applyColumnUpdate();
    return;
  }

  if (actionType === 'move-left' || actionType === 'move-right') {
    const targetIndex =
      actionType === 'move-left' ? columnIndex - 1 : columnIndex + 1;
    targetModel.page.captureSync();
    targetModel.moveColumn(columnIndex, targetIndex);
    targetModel.applyColumnUpdate();
    return;
  }

  if (actionType === 'duplicate') {
    // TODO: rich text copy throws, check reason
    targetModel.page.captureSync();
    const currentSchema = targetModel.getColumn(columnId);
    assertExists(currentSchema);
    const { id: copyId, ...nonIdProps } = currentSchema;
    const schema = { ...nonIdProps };
    const id = targetModel.addColumn(schema, columnIndex + 1);
    targetModel.applyColumnUpdate();
    targetModel.copyCellsByColumn(copyId, id);
    return;
  }
}

export function updateColumn(
  columnId: string,
  schemaProperties: Partial<Column>,
  targetModel: DatabaseBlockModel
) {
  const currentSchema = targetModel.getColumn(columnId);
  assertExists(currentSchema);
  const schema = { ...currentSchema, ...schemaProperties };
  targetModel.updateColumn(schema);
}

export function isTitleColumn(column: Column | string): column is string {
  return typeof column === 'string';
}
