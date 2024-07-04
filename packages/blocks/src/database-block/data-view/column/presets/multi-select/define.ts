import { nanoid, Text } from '@blocksuite/store';

import { tTag } from '../../../logical/data-type.js';
import { tArray } from '../../../logical/typesystem.js';
import { getTagColor } from '../../../utils/tags/colors.js';
import type { SelectTag } from '../../../utils/tags/multi-tag-select.js';
import { columnType } from '../../column-config.js';
import type { SelectColumnData } from '../../types.js';

export const multiSelectColumnType = columnType('multi-select');
declare global {
  interface ColumnConfigMap {
    [multiSelectColumnType.type]: typeof multiSelectColumnModelConfig.model;
  }
}
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
        ...oldData.options,
        { id: nanoid(), value: text, color: getTagColor() },
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
multiSelectColumnModelConfig.addConvert('select', (column, cells) => ({
  column,
  cells: cells.map(v => v?.[0]),
}));
multiSelectColumnModelConfig.addConvert('rich-text', (column, cells) => {
  const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
  return {
    column: {},
    cells: cells.map(
      arr => new Text(arr?.map(v => optionMap[v]?.value ?? '').join(',')).yText
    ),
  };
});
