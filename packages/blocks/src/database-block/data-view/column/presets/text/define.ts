import { tString } from '../../../logical/data-type.js';
import { columnType } from '../../column-config.js';

export const textColumnType = columnType('text');

declare global {
  interface ColumnConfigMap {
    [textColumnType.type]: typeof textColumnModelConfig.model;
  }
}
export const textColumnModelConfig = textColumnType.modelConfig<string>({
  cellFromString: data => {
    return {
      value: data,
    };
  },
  cellToJson: data => data ?? null,
  cellToString: data => data ?? '',
  defaultData: () => ({}),
  isEmpty: data => data == null || data.length === 0,
  name: 'Plain-Text',
  type: () => tString.create(),
});
