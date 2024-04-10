import { Text } from '@blocksuite/store';

import { tNumber } from '../../../logical/data-type.js';
import { columnType } from '../../column-config.js';

export const progressColumnType = columnType('progress');

declare global {
  interface ColumnConfigMap {
    [progressColumnType.type]: typeof progressPureColumnConfig.model;
  }
}
export const progressPureColumnConfig = progressColumnType.modelConfig<number>({
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
});
progressPureColumnConfig.addConvert('rich-text', (_column, cells) => ({
  column: {},
  cells: cells.map(v => new Text(v?.toString()).yText),
}));
