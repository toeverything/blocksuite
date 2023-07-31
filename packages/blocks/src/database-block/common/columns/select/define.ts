import { Text } from '@blocksuite/store';

import { tTag } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import type { SelectColumnData } from '../types.js';

export const selectColumnTypeName = 'select';

declare global {
  interface ColumnConfigMap {
    [selectColumnTypeName]: typeof selectPureColumnConfig;
  }
}
export const selectPureColumnConfig = columnManager.register<
  string,
  SelectColumnData
>(selectColumnTypeName, {
  name: 'Select',
  type: data => tTag.create({ tags: data.options }),
  defaultData: () => ({
    options: [],
  }),
  cellToString: (data, colData) =>
    colData.options.find(v => v.id === data)?.value ?? '',
  cellToJson: data => data ?? null,
});

selectPureColumnConfig.registerConvert('multi-select', (column, cells) => ({
  column,
  cells: cells.map(v => (v ? [v] : undefined)),
}));

selectPureColumnConfig.registerConvert('rich-text', (column, cells) => {
  const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
  return {
    column: {},
    cells: cells.map(v => new Text(v ? optionMap[v]?.value : '').yText),
  };
});
