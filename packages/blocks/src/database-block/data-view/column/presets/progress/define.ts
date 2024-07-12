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
    cellFromString: data => {
      const num = data ? Number(data) : NaN;
      return {
        value: isNaN(num) ? null : num,
      };
    },
    cellToJson: data => data ?? null,
    cellToString: data => data?.toString() ?? '',
    defaultData: () => ({}),
    isEmpty: () => false,
    name: 'Progress',
    type: () => tNumber.create(),
  }
);

progressColumnModelConfig.addConvert('rich-text', (_column, cells) => ({
  cells: cells.map(v => new Text(v?.toString()).yText),
  column: {},
}));

progressColumnModelConfig.addConvert('number', (_column, cells) => ({
  cells: cells.map(v => v),
  column: { decimal: 0 },
}));
