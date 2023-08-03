import { nanoid, Text } from '@blocksuite/store';

import { getTagColor } from '../../../../components/tags/colors.js';
import type { SelectTag } from '../../../../components/tags/multi-tag-select.js';
import { tTag } from '../../../logical/data-type.js';
import { tArray } from '../../../logical/typesystem.js';
import { columnManager } from '../manager.js';
import type { SelectColumnData } from '../types.js';

export const multiSelectColumnTypeName = 'multi-select';

declare global {
  interface ColumnConfigMap {
    'multi-select': typeof multiSelectPureColumnConfig;
  }
}
export const multiSelectPureColumnConfig = columnManager.register<
  string[],
  SelectColumnData
>(multiSelectColumnTypeName, {
  name: 'Multi-select',
  type: data => tArray(tTag.create({ tags: data.options })),
  defaultData: () => ({
    options: [],
  }),
  formatValue: v => {
    if (Array.isArray(v)) {
      return v.filter(v => v != null);
    }
    return [];
  },
  cellToString: (data, colData) =>
    data?.map(id => colData.options.find(v => v.id === id)?.value).join(' '),
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
});
multiSelectPureColumnConfig.registerConvert('select', (column, cells) => ({
  column,
  cells: cells.map(v => v?.[0]),
}));
multiSelectPureColumnConfig.registerConvert('rich-text', (column, cells) => {
  const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
  return {
    column: {},
    cells: cells.map(
      arr => new Text(arr?.map(v => optionMap[v]?.value ?? '').join(',')).yText
    ),
  };
});
