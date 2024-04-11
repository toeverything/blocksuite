import type { Text } from '@blocksuite/store';
import { nanoid } from '@blocksuite/store';

import { columnType } from '../../data-view/column/column-config.js';
import { tRichText } from '../../data-view/logical/data-type.js';
import { getTagColor } from '../../data-view/utils/tags/colors.js';
import type { SelectTag } from '../../data-view/utils/tags/multi-tag-select.js';

export const richTextColumnType = columnType('rich-text');

declare global {
  interface ColumnConfigMap {
    [richTextColumnType.type]: typeof richTextColumnModelConfig.model;
  }
}
export const richTextColumnModelConfig = richTextColumnType.modelConfig<
  Text['yText']
>({
  name: 'Text',
  type: () => tRichText.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellFromString: data => {
    return {
      value: data,
    };
  },
  cellToJson: data => data?.toString() ?? null,
});
richTextColumnModelConfig.addConvert('select', (_column, cells) => {
  const options: Record<string, SelectTag> = {};
  const getTag = (name: string) => {
    if (options[name]) return options[name];
    const tag: SelectTag = {
      id: nanoid(),
      value: name,
      color: getTagColor(),
    };
    options[name] = tag;
    return tag;
  };
  return {
    cells: cells.map(v => {
      const tags = v?.toString().split(',');
      const value = tags?.[0]?.trim();
      if (value) {
        return getTag(value).id;
      }
      return undefined;
    }),
    column: {
      options: Object.values(options),
    },
  };
});

richTextColumnModelConfig.addConvert('multi-select', (_column, cells) => {
  const options: Record<string, SelectTag> = {};
  const getTag = (name: string) => {
    if (options[name]) return options[name];
    const tag: SelectTag = {
      id: nanoid(),
      value: name,
      color: getTagColor(),
    };
    options[name] = tag;
    return tag;
  };
  return {
    cells: cells.map(v => {
      const result: string[] = [];
      const values = v?.toString().split(',');
      values?.forEach(value => {
        value = value.trim();
        if (value) {
          result.push(getTag(value).id);
        }
      });
      return result;
    }),
    column: {
      options: Object.values(options),
    },
  };
});
