import { Text } from '@blocksuite/store';

import { createIcon } from '../../../../components/icon/uni-icon.js';
import { tTag } from '../../../logical/data-type.js';
import { tArray } from '../../../logical/typesystem.js';
import { columnManager } from '../manager.js';
import { richTextColumnTypeName } from '../rich-text/define.js';
import { selectColumnTypeName } from '../select/define.js';
import type { SelectColumnData } from '../types.js';

export const multiSelectColumnTypeName = 'multiSelect';

declare global {
  interface ColumnConfigMap {
    multiSelect: typeof multiSelectPureColumnConfig;
  }
}
export const multiSelectPureColumnConfig = columnManager.register<
  string[],
  SelectColumnData
>(multiSelectColumnTypeName, {
  name: 'Multi-Select',
  icon: createIcon('DatabaseMultiSelect'),
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
multiSelectPureColumnConfig.registerConvert(
  selectColumnTypeName,
  (column, cells) => ({
    column,
    cells: cells.map(v => v?.[0]),
  })
);
multiSelectPureColumnConfig.registerConvert(
  richTextColumnTypeName,
  (column, cells) => {
    const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
    return {
      column: {},
      cells: cells.map(
        arr =>
          new Text(arr?.map(v => optionMap[v]?.value ?? '').join(',')).yText
      ),
    };
  }
);
