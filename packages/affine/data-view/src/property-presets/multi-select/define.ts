import { nanoid } from '@blocksuite/store';

import type { SelectTag } from '../../core/utils/tags/multi-tag-select.js';
import type { SelectPropertyData } from '../select/define.js';

import { tTag } from '../../core/logical/data-type.js';
import { tArray } from '../../core/logical/typesystem.js';
import { propertyType } from '../../core/property/property-config.js';
import { getTagColor } from '../../core/utils/tags/colors.js';

export const multiSelectPropertyType = propertyType('multi-select');
export const multiSelectPropertyModelConfig =
  multiSelectPropertyType.modelConfig<string[], SelectPropertyData>({
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
