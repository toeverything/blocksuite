import { assertExists } from '@blocksuite/store';

import type { DatabaseBlockModel } from '../../../database-model.js';
import type { ColumnRendererHelper } from '../../register.js';
import type { Column, ColumnActionType, ColumnType } from '../../types.js';
import { ColumnInsertPosition } from '../../types.js';

export function changeColumnType(
  columnId: string,
  targetType: ColumnType,
  targetColumn: Column | string,
  targetModel: DatabaseBlockModel,
  columnRenderer: ColumnRendererHelper
) {
  if (isTitleColumn(targetColumn)) return;

  const currentType = targetColumn.type;
  targetModel.page.captureSync();

  // select -> multi-select
  if (currentType === 'select' && targetType === 'multi-select') {
    updateColumn(columnId, { type: targetType }, targetModel);
  }
  // multi-select -> select
  else if (currentType === 'multi-select' && targetType === 'select') {
    updateColumn(columnId, { type: targetType }, targetModel);
    targetModel.convertCellsByColumn(columnId, 'select');
  }
  // number -> rich-text
  else if (currentType === 'number' && targetType === 'rich-text') {
    updateColumn(columnId, { type: targetType }, targetModel);
    targetModel.convertCellsByColumn(columnId, 'rich-text');
  } else {
    // incompatible types: clear the value of the column
    const renderer = columnRenderer.get(targetType);
    updateColumn(
      columnId,
      {
        ...renderer.propertyCreator(),
        type: targetType,
      },
      targetModel
    );
    targetModel.deleteCellsByColumn(columnId);
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
