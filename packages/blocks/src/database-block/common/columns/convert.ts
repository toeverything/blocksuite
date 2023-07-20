import { nanoid, Text } from '@blocksuite/store';

import { getTagColor } from '../../../components/tags/colors.js';
import type { SelectTag } from '../../../components/tags/multi-tag-select.js';
import { columnManager } from '../column-manager.js';
import {
  multiSelectHelper,
  numberHelper,
  progressHelper,
  richTextHelper,
  selectHelper,
} from './define.js';

columnManager.registerConvert(
  selectHelper,
  multiSelectHelper,
  (column, cells) => ({
    column,
    cells: cells.map(v => (v ? [v] : undefined)),
  })
);
columnManager.registerConvert(selectHelper, richTextHelper, (column, cells) => {
  const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
  return {
    column: {},
    cells: cells.map(v => new Text(v ? optionMap[v]?.value : '').yText),
  };
});
columnManager.registerConvert(
  multiSelectHelper,
  selectHelper,
  (column, cells) => ({
    column,
    cells: cells.map(v => v?.[0]),
  })
);
columnManager.registerConvert(
  multiSelectHelper,
  richTextHelper,
  (column, cells) => {
    const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
    return {
      column: {},
      cells: cells.map(
        arr =>
          new Text(arr?.map(v => optionMap[v]?.value ?? '').join(',')).yText
      ),
    };
  }
);
columnManager.registerConvert(
  numberHelper,
  richTextHelper,
  (column, cells) => ({
    column: {},
    cells: cells.map(v => new Text(v?.toString()).yText),
  })
);
columnManager.registerConvert(
  progressHelper,
  richTextHelper,
  (column, cells) => ({
    column: {},
    cells: cells.map(v => new Text(v?.toString()).yText),
  })
);

columnManager.registerConvert(richTextHelper, selectHelper, (column, cells) => {
  const options: Record<string, SelectTag> = {};
  const getTag = (name: string) => {
    if (options[name]) return options[name];
    const tag: SelectTag = { id: nanoid(), value: name, color: getTagColor() };
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
columnManager.registerConvert(
  richTextHelper,
  multiSelectHelper,
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
