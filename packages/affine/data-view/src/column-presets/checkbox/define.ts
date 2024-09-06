import { columnType } from '../../core/column/column-config.js';
import { tBoolean } from '../../core/logical/data-type.js';

export const checkboxColumnType = columnType('checkbox');

export const checkboxColumnModelConfig =
  checkboxColumnType.modelConfig<boolean>({
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
    isEmpty: () => false,
  });
