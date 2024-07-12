import { Text, nanoid } from '@blocksuite/store';

import type { SelectTag } from '../../../utils/tags/multi-tag-select.js';
import type { SelectColumnData } from '../../types.js';

import { tTag } from '../../../logical/data-type.js';
import { tArray } from '../../../logical/typesystem.js';
import { getTagColor } from '../../../utils/tags/colors.js';
import { columnType } from '../../column-config.js';

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
  addGroup: (text, oldData) => {
    return {
      options: [
        ...oldData.options,
        { color: getTagColor(), id: nanoid(), value: text },
      ],
    };
  },
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
          color: getTagColor(),
          id: nanoid(),
          value: name,
        };
        colData.options.push(newOption);
        value.push(newOption.id);
      } else {
        value.push(optionMap[name].id);
      }
    });

    return {
      data: colData,
      value,
    };
  },
  cellToJson: data => data ?? null,
  cellToString: (data, colData) =>
    data?.map(id => colData.options.find(v => v.id === id)?.value).join(','),
  defaultData: () => ({
    options: [],
  }),
  formatValue: v => {
    if (Array.isArray(v)) {
      return v.filter(v => v != null);
    }
    return [];
  },
  isEmpty: data => data == null || data.length === 0,
  name: 'Multi-select',
  type: data => tArray(tTag.create({ tags: data.options })),
});
multiSelectColumnModelConfig.addConvert('select', (column, cells) => ({
  cells: cells.map(v => v?.[0]),
  column,
}));
multiSelectColumnModelConfig.addConvert('rich-text', (column, cells) => {
  const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
  return {
    cells: cells.map(
      arr => new Text(arr?.map(v => optionMap[v]?.value ?? '').join(',')).yText
    ),
    column: {},
  };
});
