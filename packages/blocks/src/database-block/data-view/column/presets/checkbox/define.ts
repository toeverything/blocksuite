import { tBoolean } from '../../../logical/data-type.js';
import { columnType } from '../../column-config.js';

export const chceckboxColumnType = columnType('checkbox');
declare global {
  interface ColumnConfigMap {
    [chceckboxColumnType.type]: typeof checkboxColumnModelConfig;
  }
}

export const checkboxColumnModelConfig =
  chceckboxColumnType.modelConfig<boolean>({
    name: 'Checkbox',
    type: () => tBoolean.create(),
    defaultData: () => ({}),
    cellToString: data => (data ? 'True' : 'False'),
    cellFromString: data => {
      return {
        value: data !== 'False',
      };
    },
    cellToJson: data => data ?? null,
  });
