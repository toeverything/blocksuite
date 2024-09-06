import type { NumberColumnDataType } from './types.js';

import { columnType } from '../../core/column/column-config.js';
import { tNumber } from '../../core/logical/data-type.js';

export const numberColumnType = columnType('number');

export const numberColumnModelConfig = numberColumnType.modelConfig<
  number,
  NumberColumnDataType
>({
  name: 'Number',
  type: () => tNumber.create(),
  defaultData: () => ({ decimal: 0, format: 'number' }),
  cellToString: data => data?.toString() ?? '',
  cellFromString: data => {
    const num = data ? Number(data) : NaN;
    return {
      value: isNaN(num) ? null : num,
    };
  },
  cellToJson: data => data ?? null,
  isEmpty: data => data == null,
});
