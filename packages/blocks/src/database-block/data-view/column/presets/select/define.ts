import { Text, nanoid } from '@blocksuite/store';

import type { SelectTag } from '../../../utils/tags/multi-tag-select.js';
import type { SelectColumnData } from '../../types.js';

import { tTag } from '../../../logical/data-type.js';
import { getTagColor } from '../../../utils/tags/colors.js';
import { columnType } from '../../column-config.js';

export const selectColumnType = columnType('select');

declare global {
  interface ColumnConfigMap {
    [selectColumnType.type]: typeof selectColumnModelConfig.model;
  }
}
export const selectColumnModelConfig = selectColumnType.modelConfig<
  string,
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
    if (!data) {
      return { data: colData, value: null };
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
        color: getTagColor(),
        id: nanoid(),
        value: name,
      };
      colData.options.push(newOption);
      value = newOption.id;
    } else {
      value = option.id;
    }

    return {
      data: colData,
      value,
    };
  },
  cellToJson: data => data ?? null,
  cellToString: (data, colData) =>
    colData.options.find(v => v.id === data)?.value ?? '',
  defaultData: () => ({
    options: [],
  }),
  isEmpty: data => data == null,
  name: 'Select',
  type: data => tTag.create({ tags: data.options }),
});

selectColumnModelConfig.addConvert('multi-select', (column, cells) => ({
  cells: cells.map(v => (v ? [v] : undefined)),
  column,
}));

selectColumnModelConfig.addConvert('rich-text', (column, cells) => {
  const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
  return {
    cells: cells.map(v => new Text(v ? optionMap[v]?.value : '').yText),
    column: {},
  };
});
