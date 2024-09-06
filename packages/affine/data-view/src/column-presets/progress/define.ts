import { columnType } from '../../core/column/column-config.js';
import { tNumber } from '../../core/logical/data-type.js';

export const progressColumnType = columnType('progress');

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
