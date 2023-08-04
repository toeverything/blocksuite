import { Text } from '@blocksuite/store';

import { tNumber } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import { richTextColumnTypeName } from '../rich-text/define.js';

export const progressColumnTypeName = 'progress';

declare global {
  interface ColumnConfigMap {
    [progressColumnTypeName]: typeof progressPureColumnConfig;
  }
}
export const progressPureColumnConfig = columnManager.register<number>(
  progressColumnTypeName,
  {
    name: 'Progress',
    type: () => tNumber.create(),
    defaultData: () => ({}),
    cellToString: data => data?.toString() ?? '',
    cellFromString: data => {
      const num = data ? Number(data) : NaN;
      return {
        value: isNaN(num) ? null : num,
      };
    },
    cellToJson: data => data ?? null,
  }
);
progressPureColumnConfig.registerConvert(
  richTextColumnTypeName,
  (column, cells) => ({
    column: {},
    cells: cells.map(v => new Text(v?.toString()).yText),
  })
);
