import { nanoid } from '@blocksuite/store';

import type { SelectPropertyData } from '../select/define.js';

import { getTagColor } from '../../core/component/tags/colors.js';
import { type SelectTag, t } from '../../core/index.js';
import { propertyType } from '../../core/property/property-config.js';

export const multiSelectPropertyType = propertyType('multi-select');
export const multiSelectPropertyModelConfig =
  multiSelectPropertyType.modelConfig<string[], SelectPropertyData>({
    name: 'Multi-select',
    type: data => t.array.instance(t.tag.instance(data.options)),
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
