import { nanoid } from '@blocksuite/store';

import type { SelectTag } from '../../core/utils/tags/multi-tag-select.js';

import { columnType } from '../../core/column/column-config.js';
import { tTag } from '../../core/logical/data-type.js';
import { getTagColor } from '../../core/utils/tags/colors.js';

export const selectColumnType = columnType('select');

export type SelectColumnData = {
  options: SelectTag[];
};
export const selectColumnModelConfig = selectColumnType.modelConfig<
  string,
  SelectColumnData
>({
  name: 'Select',
  type: data => tTag.create({ tags: data.options }),
  defaultData: () => ({
    options: [],
  }),
  addGroup: (text, oldData) => {
    return {
      options: [
        ...(oldData.options ?? []),
        { id: nanoid(), value: text, color: getTagColor() },
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
        id: nanoid(),
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
  isEmpty: data => data == null,
});
