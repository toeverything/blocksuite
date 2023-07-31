import type { Text } from '@blocksuite/store';
import { nanoid } from '@blocksuite/store';

import { getTagColor } from '../../../../components/tags/colors.js';
import type { SelectTag } from '../../../../components/tags/multi-tag-select.js';
import { tString } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import { multiSelectColumnTypeName } from '../multi-select/define.js';
import { selectColumnTypeName } from '../select/define.js';

export const richTextColumnTypeName = 'rich-text';

declare global {
  interface ColumnConfigMap {
    [richTextColumnTypeName]: typeof richTextPureColumnConfig;
  }
}
export const richTextPureColumnConfig = columnManager.register<Text['yText']>(
  richTextColumnTypeName,
  {
    name: 'Text',
    type: () => tString.create(),
    defaultData: () => ({}),
    cellToString: data => data?.toString() ?? '',
    cellToJson: data => data?.toString() ?? null,
  }
);
richTextPureColumnConfig.registerConvert(
  selectColumnTypeName,
  (column, cells) => {
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
  }
);

richTextPureColumnConfig.registerConvert(
  multiSelectColumnTypeName,
  (column, cells) => {
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
  }
);
