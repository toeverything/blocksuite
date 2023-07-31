import { Text } from '@blocksuite/store';

import { tTag } from '../../../logical/data-type.js';
import { tArray } from '../../../logical/typesystem.js';
import { columnManager } from '../manager.js';
import type { SelectColumnData } from '../types.js';

export const multiSelectColumnTypeName = 'multi-select';

declare global {
  interface ColumnConfigMap {
    'multi-select': typeof multiSelectPureColumnConfig;
  }
}
export const multiSelectPureColumnConfig = columnManager.register<
  string[],
  SelectColumnData
>(multiSelectColumnTypeName, {
  name: 'Multi-select',
  type: data => tArray(tTag.create({ tags: data.options })),
  defaultData: () => ({
    options: [],
  }),
  formatValue: v => {
    if (Array.isArray(v)) {
      return v.filter(v => v != null);
    }
    return [];
  },
  cellToString: (data, colData) =>
    data?.map(id => colData.options.find(v => v.id === id)?.value).join(' '),
  cellToJson: data => data ?? null,
});
multiSelectPureColumnConfig.registerConvert('select', (column, cells) => ({
  column,
  cells: cells.map(v => v?.[0]),
}));
multiSelectPureColumnConfig.registerConvert('rich-text', (column, cells) => {
  const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
  return {
    column: {},
    cells: cells.map(
      arr => new Text(arr?.map(v => optionMap[v]?.value ?? '').join(',')).yText
    ),
  };
});
