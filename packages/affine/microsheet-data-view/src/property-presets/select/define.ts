import { nanoid } from '@blocksuite/store';

import type { SelectTag } from '../../core/utils/tags/multi-tag-select.js';

import { tTag } from '../../core/logical/data-type.js';
import { propertyType } from '../../core/property/property-config.js';
import { getTagColor } from '../../core/utils/tags/colors.js';

export const selectPropertyType = propertyType('select');

export type SelectPropertyData = {
  options: SelectTag[];
};
export const selectPropertyModelConfig = selectPropertyType.modelConfig<
  string,
  SelectPropertyData
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
