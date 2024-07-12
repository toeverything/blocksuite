import { Text } from '@blocksuite/store';

import { clamp } from '../../../../../_common/utils/math.js';
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
  cellFromString: data => {
    const num = data ? Number(data) : NaN;
    return {
      value: isNaN(num) ? null : num,
    };
  },
  cellToJson: data => data ?? null,
  cellToString: data => data?.toString() ?? '',
  defaultData: () => ({ decimal: 0 }),
  isEmpty: data => data == null,
  name: 'Number',
  type: () => tNumber.create(),
});

numberColumnModelConfig.addConvert('rich-text', (_column, cells) => ({
  cells: cells.map(v => new Text(v?.toString()).yText),
  column: {},
}));

numberColumnModelConfig.addConvert('progress', (_column, cells) => ({
  cells: cells.map(v => clamp(v ?? 0, 0, 100)),
  column: {},
}));
