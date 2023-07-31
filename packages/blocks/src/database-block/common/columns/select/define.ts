import { Text } from '@blocksuite/store';

import { createIcon } from '../../../../components/icon/uni-icon.js';
import { tTag } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import { multiSelectColumnTypeName } from '../multi-select/define.js';
import { richTextColumnTypeName } from '../rich-text/define.js';
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
  icon: createIcon('DatabaseSelect'),
  type: data => tTag.create({ tags: data.options }),
  defaultData: () => ({
    options: [],
  }),
  cellToString: (data, colData) =>
    colData.options.find(v => v.id === data)?.value ?? '',
  cellToJson: data => data ?? null,
});

selectPureColumnConfig.registerConvert(
  multiSelectColumnTypeName,
  (column, cells) => ({
    column,
    cells: cells.map(v => (v ? [v] : undefined)),
  })
);

selectPureColumnConfig.registerConvert(
  richTextColumnTypeName,
  (column, cells) => {
    const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
    return {
      column: {},
      cells: cells.map(v => new Text(v ? optionMap[v]?.value : '').yText),
    };
  }
);
