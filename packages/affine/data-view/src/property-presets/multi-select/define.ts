import { nanoid } from '@blocksuite/store';

import type { SelectPropertyData } from '../select/define.js';

import { getTagColor } from '../../core/component/tags/colors.js';
import { type SelectTag, t } from '../../core/index.js';
import { propertyType } from '../../core/property/property-config.js';

export const multiSelectPropertyType = propertyType('multi-select');
export const multiSelectPropertyModelConfig =
  multiSelectPropertyType.modelConfig<string[], SelectPropertyData>({
    name: 'Multi-select',
    type: ({ data }) => t.array.instance(t.tag.instance(data.options)),
    defaultData: () => ({
      options: [],
    }),
    addGroup: ({ text, oldData }) => {
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
    formatValue: ({ value }) => {
      if (Array.isArray(value)) {
        return value.filter(v => v != null);
      }
      return [];
    },
    cellToString: ({ value, data }) =>
      value?.map(id => data.options.find(v => v.id === id)?.value).join(','),
    cellFromString: ({ value: stringValue, data }) => {
      const optionMap = new Map(data.options.map(v => [v.value, v]));
      const optionNames = stringValue
        .split(',')
        .map(v => v.trim())
        .filter(v => v);

      const value: string[] = [];
      optionNames.forEach(name => {
        const option = optionMap.get(name);
        if (!option) {
          const newOption: SelectTag = {
            id: nanoid(),
            value: name,
            color: getTagColor(),
          };
          optionMap.set(name, newOption);
          value.push(newOption.id);
        } else {
          value.push(option.id);
        }
      });

      return {
        value,
        data: {
          ...data,
          options: Array.from(optionMap.values()),
        },
      };
    },
    cellToJson: ({ value }) => value ?? null,
    isEmpty: ({ value }) => value == null || value.length === 0,
  });
