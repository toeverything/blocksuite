import { Text } from '@blocksuite/store';

import { tNumber } from '../../../logical/data-type.js';
import { columnType } from '../../column-config.js';

export const numberColumnType = columnType('number');

declare global {
  interface ColumnConfigMap {
    [numberColumnType.type]: typeof numberColumnModelConfig.model;
  }
}
export const numberColumnModelConfig = numberColumnType.modelConfig<
  number,
  {
    decimal: number;
  }
>({
  name: 'Number',
  type: () => tNumber.create(),
  defaultData: () => ({ decimal: 0 }),
  cellToString: data => data?.toString() ?? '',
  cellFromString: data => {
    const num = data ? Number(data) : NaN;
    return {
      value: isNaN(num) ? null : num,
    };
  },
  cellToJson: data => data ?? null,
});
numberColumnModelConfig.addConvert('rich-text', (_column, cells) => ({
  column: {},
  cells: cells.map(v => new Text(v?.toString()).yText),
}));
