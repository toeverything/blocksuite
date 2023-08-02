import { tString } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';

export const textColumnTypeName = 'text';

declare global {
  interface ColumnConfigMap {
    [textColumnTypeName]: typeof textPureColumnConfig;
  }
}
export const textPureColumnConfig = columnManager.register<string>(
  textColumnTypeName,
  {
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
  }
);
