import { tString } from '../../../logical/data-type.js';
import { columnType } from '../../column-config.js';

export const textColumnType = columnType('text');

declare global {
  interface ColumnConfigMap {
    [textColumnType.type]: typeof textColumnModelConfig.model;
  }
}
export const textColumnModelConfig = textColumnType.modelConfig<string>({
  name: 'Plain-Text',
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data ?? '',
  cellFromString: data => {
    return {
      value: data,
    };
  },
  cellToJson: data => data ?? null,
  isEmpty: data => data == null || data.length === 0,
});
