import { Text } from '@blocksuite/store';

import { tNumber } from '../../../logical/data-type.js';
import { columnType } from '../../column-config.js';

export const progressColumnType = columnType('progress');

declare global {
  interface ColumnConfigMap {
    [progressColumnType.type]: typeof progressColumnModelConfig.model;
  }
}
export const progressColumnModelConfig = progressColumnType.modelConfig<number>(
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
    isEmpty: () => false,
  }
);

progressColumnModelConfig.addConvert('rich-text', (_column, cells) => ({
  column: {},
  cells: cells.map(v => new Text(v?.toString()).yText),
}));

progressColumnModelConfig.addConvert('number', (_column, cells) => ({
  column: { decimal: 0 },
  cells: cells.map(v => v),
}));
