import { tString } from '../../../logical/data-type.js';
import { columnType } from '../../column-config.js';

export const linkColumnType = columnType('link');
declare global {
  interface ColumnConfigMap {
    [linkColumnType.type]: typeof linkColumnModelConfig.model;
  }
}
export const linkColumnModelConfig = linkColumnType.modelConfig<string>({
  cellFromString: data => {
    return {
      value: data,
    };
  },
  cellToJson: data => data ?? null,
  cellToString: data => data?.toString() ?? '',
  defaultData: () => ({}),
  isEmpty: data => data == null || data.length == 0,
  name: 'Link',
  type: () => tString.create(),
});
