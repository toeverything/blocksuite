import { propertyType, t } from '@blocksuite/data-view';
import { Text } from '@blocksuite/store';

import { HostContextKey } from '../../context/host-context.js';
import { isLinkedDoc } from '../../utils/title-doc.js';

export const titleColumnType = propertyType('title');

export const titlePurePropertyConfig = titleColumnType.modelConfig<Text>({
  name: 'Title',
  type: () => t.richText.instance(),
  defaultData: () => ({}),
  cellToString: ({ value }) => value?.toString() ?? '',
  cellFromString: ({ value }) => {
    return {
      value: value,
    };
  },
  cellToJson: ({ value, dataSource }) => {
    const host = dataSource.contextGet(HostContextKey);
    if (host) {
      const collection = host.std.collection;
      const deltas = value.deltas$.value;
      const text = deltas
        .map(delta => {
          if (isLinkedDoc(delta)) {
            const linkedDocId = delta.attributes?.reference?.pageId as string;
            return collection.getDoc(linkedDocId)?.meta?.title;
          }
          return delta.insert;
        })
        .join('');
      return text;
    }
    return value?.toString() ?? null;
  },
  cellFromJson: ({ value }) =>
    typeof value !== 'string' ? undefined : new Text(value),
  onUpdate: ({ value, callback }) => {
    value.yText.observe(callback);
    callback();
    return {
      dispose: () => {
        value.yText.unobserve(callback);
      },
    };
  },
  valueUpdate: ({ value, newValue }) => {
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
  isEmpty: ({ value }) => value == null || value.length === 0,
  values: ({ value }) => (value?.toString() ? [value.toString()] : []),
});
