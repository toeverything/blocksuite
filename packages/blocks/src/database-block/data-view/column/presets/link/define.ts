import { tString } from '../../../logical/data-type.js';
import { columnType } from '../../column-config.js';

export const linkColumnType = columnType('link');
declare global {
  interface ColumnConfigMap {
    [linkColumnType.type]: typeof linkPureColumnConfig.model;
  }
}
export const linkPureColumnConfig = linkColumnType.modelConfig<string>({
  name: 'Link',
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellFromString: data => {
    return {
      value: data,
    };
  },
  cellToJson: data => data ?? null,
});
