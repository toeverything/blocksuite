import { Text } from '@blocksuite/store';

import { createIcon } from '../../../../components/icon/uni-icon.js';
import { tNumber } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import { richTextColumnTypeName } from '../rich-text/define.js';

export const numberColumnTypeName = 'number';

declare global {
  interface ColumnConfigMap {
    [numberColumnTypeName]: typeof numberPureColumnConfig;
  }
}
export const numberPureColumnConfig = columnManager.register<
  number,
  {
    decimal: number;
  }
>(numberColumnTypeName, {
  name: 'Number',
  icon: createIcon('DatabaseNumber'),
  type: () => tNumber.create(),
  defaultData: () => ({ decimal: 0 }),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data ?? null,
});
numberPureColumnConfig.registerConvert(
  richTextColumnTypeName,
  (column, cells) => ({
    column: {},
    cells: cells.map(v => new Text(v?.toString()).yText),
  })
);
