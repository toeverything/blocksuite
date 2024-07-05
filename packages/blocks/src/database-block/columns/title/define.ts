import type { Text } from '@blocksuite/store';

import { columnType } from '../../data-view/column/column-config.js';
import { tRichText } from '../../data-view/logical/data-type.js';

export const titleColumnType = columnType('title');

declare global {
  interface ColumnConfigMap {
    [titleColumnType.type]: typeof titlePureColumnConfig.model;
  }
}

export const titlePureColumnConfig = titleColumnType.modelConfig<Text>({
  name: 'Title',
  type: () => tRichText.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellFromString: data => {
    return {
      value: data,
    };
  },
  cellToJson: data => data?.toString() ?? null,
  onUpdate: (value, _data, callback) => {
    value.yText.observe(callback);
    callback();
    return {
      dispose: () => {
        value.yText.unobserve(callback);
      },
    };
  },
  valueUpdate: (value, _data, newValue) => {
    const v = newValue as unknown;
    if (typeof v === 'string') {
      value.replace(0, value.length, v);
      return value;
    }
    return newValue;
  },
  isEmpty: data => data == null || data.length === 0,
});
