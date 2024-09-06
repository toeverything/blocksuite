import { columnType } from '../../core/column/column-config.js';
import { tString } from '../../core/logical/data-type.js';

export const textColumnType = columnType('text');

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
