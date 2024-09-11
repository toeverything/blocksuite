import { nanoid } from '@blocksuite/store';

import type { SelectTag } from '../../core/utils/tags/multi-tag-select.js';
import type { SelectColumnData } from '../select/define.js';

import { columnType } from '../../core/column/column-config.js';
import { tTag } from '../../core/logical/data-type.js';
import { tArray } from '../../core/logical/typesystem.js';
import { getTagColor } from '../../core/utils/tags/colors.js';

export const multiSelectColumnType = columnType('multi-select');
export const multiSelectColumnModelConfig = multiSelectColumnType.modelConfig<
  string[],
  SelectColumnData
>({
  name: 'Multi-select',
  type: data => tArray(tTag.create({ tags: data.options })),
  defaultData: () => ({
    options: [],
  }),
  addGroup: (text, oldData) => {
    return {
      options: [
        ...(oldData.options ?? []),
        {
          id: nanoid(),
          value: text,
          color: getTagColor(),
        },
      ],
    };
  },
  formatValue: v => {
    if (Array.isArray(v)) {
      return v.filter(v => v != null);
    }
    return [];
  },
  cellToString: (data, colData) =>
    data?.map(id => colData.options.find(v => v.id === id)?.value).join(','),
  cellFromString: (data, colData) => {
    const optionMap = Object.fromEntries(
      colData.options.map(v => [v.value, v])
    );
    const optionNames = data
      .split(',')
      .map(v => v.trim())
      .filter(v => v);

    const value: string[] = [];
    optionNames.forEach(name => {
      if (!optionMap[name]) {
        const newOption: SelectTag = {
          id: nanoid(),
          value: name,
          color: getTagColor(),
        };
        colData.options.push(newOption);
        value.push(newOption.id);
      } else {
        value.push(optionMap[name].id);
      }
    });

    return {
      value,
      data: colData,
    };
  },
  cellToJson: data => data ?? null,
  isEmpty: data => data == null || data.length === 0,
});
