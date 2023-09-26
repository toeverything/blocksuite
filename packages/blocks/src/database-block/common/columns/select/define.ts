import { nanoid, Text } from '@blocksuite/store';

import { getTagColor } from '../../../../components/tags/colors.js';
import type { SelectTag } from '../../../../components/tags/multi-tag-select.js';
import { tTag } from '../../../logical/data-type.js';
import { columnManager } from '../manager.js';
import type { SelectColumnData } from '../types.js';

export const selectColumnTypeName = 'select';

declare global {
  interface ColumnConfigMap {
    [selectColumnTypeName]: typeof selectPureColumnConfig;
  }
}
export const selectPureColumnConfig = columnManager.register<
  string,
  SelectColumnData
>(selectColumnTypeName, {
  name: 'Select',
  type: data => tTag.create({ tags: data.options }),
  defaultData: () => ({
    options: [],
  }),
  addGroup: (text, oldData) => {
    return {
      options: [
        ...oldData.options,
        { id: nanoid('unknown'), value: text, color: getTagColor() },
      ],
    };
  },
  cellToString: (data, colData) =>
    colData.options.find(v => v.id === data)?.value ?? '',
  cellFromString: (data, colData) => {
    if (!data) {
      return { value: null, data: colData };
    }
    const optionMap = Object.fromEntries(
      colData.options.map(v => [v.value, v])
    );
    const name = data
      .split(',')
      .map(v => v.trim())
      .filter(v => v)[0];

    let value = null;
    const option = optionMap[name];
    if (!option) {
      const newOption: SelectTag = {
        id: nanoid('unknown'),
        value: name,
        color: getTagColor(),
      };
      colData.options.push(newOption);
      value = newOption.id;
    } else {
      value = option.id;
    }

    return {
      value,
      data: colData,
    };
  },
  cellToJson: data => data ?? null,
});

selectPureColumnConfig.registerConvert('multi-select', (column, cells) => ({
  column,
  cells: cells.map(v => (v ? [v] : undefined)),
}));

selectPureColumnConfig.registerConvert('rich-text', (column, cells) => {
  const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
  return {
    column: {},
    cells: cells.map(v => new Text(v ? optionMap[v]?.value : '').yText),
  };
});
