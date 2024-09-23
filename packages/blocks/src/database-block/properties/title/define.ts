import type { Text } from '@blocksuite/store';

import { propertyType, tRichText } from '@blocksuite/data-view';

export const titleColumnType = propertyType('title');

export const titlePurePropertyConfig = titleColumnType.modelConfig<Text>({
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
    if (v == null) {
      value.replace(0, value.length, '');
      return value;
    }
    return newValue;
  },
  isEmpty: data => data == null || data.length === 0,
  values: data => (data?.toString() ? [data.toString()] : []),
});
