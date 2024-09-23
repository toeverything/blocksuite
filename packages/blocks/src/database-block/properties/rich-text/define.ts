import { propertyType, tRichText } from '@blocksuite/data-view';
import { Text } from '@blocksuite/store';

import { type RichTextCellType, toYText } from '../utils.js';

export const richTextColumnType = propertyType('rich-text');

export const richTextColumnModelConfig =
  richTextColumnType.modelConfig<RichTextCellType>({
    name: 'Text',
    type: () => tRichText.create(),
    defaultData: () => ({}),
    cellToString: data => data?.toString() ?? '',
    cellFromString: data => {
      return {
        value: new Text(data),
      };
    },
    cellToJson: data => data?.toString() ?? null,
    onUpdate: (value, _data, callback) => {
      const yText = toYText(value);
      yText.observe(callback);
      callback();
      return {
        dispose: () => {
          yText.unobserve(callback);
        },
      };
    },
    isEmpty: data => data == null || data.length === 0,
    values: data => (data?.toString() ? [data.toString()] : []),
  });
