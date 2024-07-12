import { Text } from '@blocksuite/store';

import { tBoolean } from '../../../logical/data-type.js';
import { columnType } from '../../column-config.js';

export const checkboxColumnType = columnType('checkbox');
declare global {
  interface ColumnConfigMap {
    [checkboxColumnType.type]: typeof checkboxColumnModelConfig.model;
  }
}

export const checkboxColumnModelConfig =
  checkboxColumnType.modelConfig<boolean>({
    cellFromString: data => {
      return {
        value: data !== 'False',
      };
    },
    cellToJson: data => data ?? null,
    cellToString: data => (data ? 'True' : 'False'),
    defaultData: () => ({}),
    isEmpty: () => false,
    name: 'Checkbox',
    type: () => tBoolean.create(),
  });

checkboxColumnModelConfig.addConvert('rich-text', (_columns, cells) => {
  return {
    cells: cells.map(v => new Text(v ? 'Yes' : 'No').yText),
    column: {},
  };
});
