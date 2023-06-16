import { assertExists } from '@blocksuite/store';

import { columnManager } from '../../../common/column-manager.js';
import type { DatabaseBlockModel } from '../../../database-model.js';
import type { Column, ColumnType } from '../../types.js';

export function changeColumnType(
  database: DatabaseBlockModel,
  column: Column,
  toType: ColumnType
) {
  const currentType = column.type;
  database.page.captureSync();
  const [newColumnData, update = () => null] =
    columnManager.convertCell(currentType, toType, column.data) ?? [];
  updateColumn(
    column.id,
    { type: toType, data: newColumnData ?? columnManager.defaultData(toType) },
    database
  );
  database.updateCellByColumn(column.id, update);
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
