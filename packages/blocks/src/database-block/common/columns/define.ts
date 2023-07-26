import type { Text } from '@blocksuite/store';

import type { SelectTag } from '../../../components/tags/multi-tag-select.js';
import {
  tBoolean,
  tDate,
  tNumber,
  tString,
  tTag,
} from '../../logical/data-type.js';
import { tArray } from '../../logical/typesystem.js';
import { columnManager } from './manager.js';

export const titleHelper = columnManager.register<Text['yText']>('title', {
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data?.toString() ?? null,
});
export const richTextHelper = columnManager.register<Text['yText']>(
  'rich-text',
  {
    type: () => tString.create(),
    defaultData: () => ({}),
    cellToString: data => data?.toString() ?? '',
    cellToJson: data => data?.toString() ?? null,
  }
);
export type SelectColumnData = {
  options: SelectTag[];
};
export const selectHelper = columnManager.register<string, SelectColumnData>(
  'select',
  {
    type: data => tTag.create({ tags: data.options }),
    defaultData: () => ({
      options: [],
    }),
    cellToString: (data, colData) =>
      colData.options.find(v => v.id === data)?.value ?? '',
    cellToJson: data => data ?? null,
  }
);
export const multiSelectHelper = columnManager.register<
  string[],
  SelectColumnData
>('multi-select', {
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
  cellToJson: data => data ?? null,
});
export const numberHelper = columnManager.register<
  number,
  {
    decimal: number;
  }
>('number', {
  type: () => tNumber.create(),
  defaultData: () => ({ decimal: 0 }),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data ?? null,
});
export const checkboxHelper = columnManager.register<boolean>('checkbox', {
  type: () => tBoolean.create(),
  defaultData: () => ({}),
  cellToString: data => '',
  cellToJson: data => data ?? null,
});
export const progressHelper = columnManager.register<number>('progress', {
  type: () => tNumber.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data ?? null,
});
export const linkHelper = columnManager.register<string>('link', {
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data ?? null,
});
export const textHelper = columnManager.register<string>('text', {
  type: () => tString.create(),
  defaultData: () => ({}),
  cellToString: data => data ?? '',
  cellToJson: data => data ?? null,
});
export const dateHelper = columnManager.register<number>('date', {
  type: () => tDate.create(),
  defaultData: () => ({}),
  cellToString: data => data?.toString() ?? '',
  cellToJson: data => data ?? null,
});
