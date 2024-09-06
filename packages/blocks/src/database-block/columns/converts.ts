import { clamp } from '@blocksuite/affine-shared/utils';
import {
  createColumnConvert,
  getTagColor,
  type SelectTag,
} from '@blocksuite/data-view';
import { presetColumnConverts } from '@blocksuite/data-view/column-presets';
import { columnModelPresets } from '@blocksuite/data-view/column-pure-presets';
import { nanoid, Text } from '@blocksuite/store';

import { richTextColumnModelConfig } from './rich-text/define.js';

export const databaseColumnConverts = [
  ...presetColumnConverts,
  createColumnConvert(
    richTextColumnModelConfig,
    columnModelPresets.selectColumnModelConfig,
    (_column, cells) => {
      const options: Record<string, SelectTag> = {};
      const getTag = (name: string) => {
        if (options[name]) return options[name];
        const tag: SelectTag = {
          id: nanoid(),
          value: name,
          color: getTagColor(),
        };
        options[name] = tag;
        return tag;
      };
      return {
        cells: cells.map(v => {
          const tags = v?.toString().split(',');
          const value = tags?.[0]?.trim();
          if (value) {
            return getTag(value).id;
          }
          return undefined;
        }),
        column: {
          options: Object.values(options),
        },
      };
    }
  ),
  createColumnConvert(
    richTextColumnModelConfig,
    columnModelPresets.multiSelectColumnModelConfig,
    (_column, cells) => {
      const options: Record<string, SelectTag> = {};
      const getTag = (name: string) => {
        if (options[name]) return options[name];
        const tag: SelectTag = {
          id: nanoid(),
          value: name,
          color: getTagColor(),
        };
        options[name] = tag;
        return tag;
      };
      return {
        cells: cells.map(v => {
          const result: string[] = [];
          const values = v?.toString().split(',');
          values?.forEach(value => {
            value = value.trim();
            if (value) {
              result.push(getTag(value).id);
            }
          });
          return result;
        }),
        column: {
          options: Object.values(options),
        },
      };
    }
  ),
  createColumnConvert(
    richTextColumnModelConfig,
    columnModelPresets.numberColumnModelConfig,
    (_column, cells) => {
      return {
        column: {
          decimal: 0,
          format: 'number' as const,
        },
        cells: cells.map(v => {
          const num = v ? parseFloat(v.toString()) : NaN;
          return isNaN(num) ? undefined : num;
        }),
      };
    }
  ),
  createColumnConvert(
    richTextColumnModelConfig,
    columnModelPresets.progressColumnModelConfig,
    (_column, cells) => {
      return {
        column: {},
        cells: cells.map(v => {
          const progress = v ? parseInt(v.toString()) : NaN;
          return !isNaN(progress) ? clamp(progress, 0, 100) : undefined;
        }),
      };
    }
  ),
  createColumnConvert(
    richTextColumnModelConfig,
    columnModelPresets.checkboxColumnModelConfig,
    (_column, cells) => {
      const truthyValues = ['yes', 'true'];
      return {
        column: {},
        cells: cells.map(v =>
          v && truthyValues.includes(v.toString().toLowerCase())
            ? true
            : undefined
        ),
      };
    }
  ),
  createColumnConvert(
    columnModelPresets.checkboxColumnModelConfig,
    richTextColumnModelConfig,
    (_columns, cells) => {
      return {
        column: {},
        cells: cells.map(v => new Text(v ? 'Yes' : 'No').yText),
      };
    }
  ),
  createColumnConvert(
    columnModelPresets.multiSelectColumnModelConfig,
    richTextColumnModelConfig,
    (column, cells) => {
      const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
      return {
        column: {},
        cells: cells.map(
          arr =>
            new Text(arr?.map(v => optionMap[v]?.value ?? '').join(',')).yText
        ),
      };
    }
  ),
  createColumnConvert(
    columnModelPresets.numberColumnModelConfig,
    richTextColumnModelConfig,
    (_column, cells) => ({
      column: {},
      cells: cells.map(v => new Text(v?.toString()).yText),
    })
  ),
  createColumnConvert(
    columnModelPresets.progressColumnModelConfig,
    richTextColumnModelConfig,
    (_column, cells) => ({
      column: {},
      cells: cells.map(v => new Text(v?.toString()).yText),
    })
  ),
  createColumnConvert(
    columnModelPresets.selectColumnModelConfig,
    richTextColumnModelConfig,
    (column, cells) => {
      const optionMap = Object.fromEntries(column.options.map(v => [v.id, v]));
      return {
        column: {},
        cells: cells.map(v => new Text(v ? optionMap[v]?.value : '').yText),
      };
    }
  ),
];
