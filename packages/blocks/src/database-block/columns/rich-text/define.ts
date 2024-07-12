import { Text, nanoid } from '@blocksuite/store';

import type { SelectTag } from '../../data-view/utils/tags/multi-tag-select.js';

import { clamp } from '../../../_common/utils/math.js';
import { columnType } from '../../data-view/column/column-config.js';
import { tRichText } from '../../data-view/logical/data-type.js';
import { getTagColor } from '../../data-view/utils/tags/colors.js';
import { type RichTextCellType, toYText } from '../utils.js';

export const richTextColumnType = columnType('rich-text');

declare global {
  interface ColumnConfigMap {
    [richTextColumnType.type]: typeof richTextColumnModelConfig.model;
  }
}

export const richTextColumnModelConfig =
  richTextColumnType.modelConfig<RichTextCellType>({
    cellFromString: data => {
      return {
        value: new Text(data),
      };
    },
    cellToJson: data => data?.toString() ?? null,
    cellToString: data => data?.toString() ?? '',
    defaultData: () => ({}),
    isEmpty: data => data == null || data.length === 0,
    name: 'Text',
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
    type: () => tRichText.create(),
  });

richTextColumnModelConfig.addConvert('select', (_column, cells) => {
  const options: Record<string, SelectTag> = {};
  const getTag = (name: string) => {
    if (options[name]) return options[name];
    const tag: SelectTag = {
      color: getTagColor(),
      id: nanoid(),
      value: name,
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
      color: getTagColor(),
      id: nanoid(),
      value: name,
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

richTextColumnModelConfig.addConvert('number', (_column, cells) => {
  return {
    cells: cells.map(v => {
      const num = v ? parseFloat(v.toString()) : NaN;
      return isNaN(num) ? undefined : num;
    }),
    column: { decimal: 0 },
  };
});

richTextColumnModelConfig.addConvert('progress', (_column, cells) => {
  return {
    cells: cells.map(v => {
      const progress = v ? parseInt(v.toString()) : NaN;
      return !isNaN(progress) ? clamp(progress, 0, 100) : undefined;
    }),
    column: {},
  };
});

richTextColumnModelConfig.addConvert('checkbox', (_column, cells) => {
  const truthyValues = ['yes', 'true'];
  return {
    cells: cells.map(v =>
      v && truthyValues.includes(v.toString().toLowerCase()) ? true : undefined
    ),
    column: {},
  };
});
