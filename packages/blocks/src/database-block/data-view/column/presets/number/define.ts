import { Text } from '@blocksuite/store';

import { tNumber } from '../../../logical/data-type.js';
import { columnType } from '../../column-config.js';

export const numberColumnType = columnType('number');

declare global {
  interface ColumnConfigMap {
    [numberColumnType.type]: typeof numberPureColumnConfig.model;
  }
}
export const numberPureColumnConfig = numberColumnType.modelConfig<
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
numberPureColumnConfig.addConvert('rich-text', (_column, cells) => ({
  column: {},
  cells: cells.map(v => new Text(v?.toString()).yText),
}));
