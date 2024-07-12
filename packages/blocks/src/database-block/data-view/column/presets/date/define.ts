import { tDate } from '../../../logical/data-type.js';
import { columnType } from '../../column-config.js';

export const dateColumnType = columnType('date');
declare global {
  interface ColumnConfigMap {
    [dateColumnType.type]: typeof dateColumnModelConfig.model;
  }
}
export const dateColumnModelConfig = dateColumnType.modelConfig<number>({
  cellFromString: data => {
    const isDateFormat = !isNaN(Date.parse(data));

    return {
      value: isDateFormat ? +new Date(data) : null,
    };
  },
  cellToJson: data => data ?? null,
  cellToString: data => data?.toString() ?? '',
  defaultData: () => ({}),
  isEmpty: data => data == null,
  name: 'Date',
  type: () => tDate.create(),
});
