import { columnType } from '../../core/column/column-config.js';
import { tDate } from '../../core/logical/data-type.js';

export const dateColumnType = columnType('date');
export const dateColumnModelConfig = dateColumnType.modelConfig<number>({
  name: 'Date',
  type: () => tDate.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellFromString: data => {
    const isDateFormat = !isNaN(Date.parse(data));

    return {
      value: isDateFormat ? +new Date(data) : null,
    };
  },
  cellToJson: data => data ?? null,
  isEmpty: data => data == null,
});
