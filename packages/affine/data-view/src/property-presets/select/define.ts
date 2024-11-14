import { nanoid } from '@blocksuite/store';

import { getTagColor } from '../../core/component/tags/colors.js';
import { type SelectTag, t } from '../../core/index.js';
import { propertyType } from '../../core/property/property-config.js';

export const selectPropertyType = propertyType('select');

export type SelectPropertyData = {
  options: SelectTag[];
};
export const selectPropertyModelConfig = selectPropertyType.modelConfig<
  string,
  SelectPropertyData
>({
  name: 'Select',
  type: ({ data }) => t.tag.instance(data.options),
  defaultData: () => ({
    options: [],
  }),
  addGroup: ({ text, oldData }) => {
    return {
      options: [
        ...(oldData.options ?? []),
        { id: nanoid(), value: text, color: getTagColor() },
      ],
    };
  },
  cellToString: ({ value, data }) =>
    data.options.find(v => v.id === value)?.value ?? '',
  cellFromString: ({ value: stringValue, data }) => {
    if (!stringValue) {
      return { value: null, data: data };
    }
    const optionMap = new Map(data.options.map(v => [v.value, v]));
    const name = stringValue
      .split(',')
      .map(v => v.trim())
      .filter(v => v)[0];

    let value: string | undefined;
    const option = optionMap.get(name);
    if (!option) {
      const newOption: SelectTag = {
        id: nanoid(),
        value: name,
        color: getTagColor(),
      };
      optionMap.set(name, newOption);
      value = newOption.id;
    } else {
      value = option.id;
    }

    return {
      value,
      data: {
        ...data,
        options: Array.from(optionMap.values()),
      },
    };
  },
  cellToJson: ({ value }) => value ?? null,
  isEmpty: ({ value }) => value == null,
});
