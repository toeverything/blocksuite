import { clamp } from '@blocksuite/affine-shared/utils';
import { Text } from '@blocksuite/store';

import type { NumberFormat } from './utils/formatter.js';

import { tNumber } from '../../../logical/data-type.js';
import { columnType } from '../../column-config.js';

export const numberColumnType = columnType('number');

declare global {
  interface ColumnConfigMap {
    [numberColumnType.type]: typeof numberColumnModelConfig.model;
  }
}
export type NumberColumnDataType = {
  decimal?: number;
  format?: NumberFormat;
};
export const numberColumnModelConfig = numberColumnType.modelConfig<
  number,
  NumberColumnDataType
>({
  name: 'Number',
  type: () => tNumber.create(),
  defaultData: () => ({ decimal: 0, format: 'number' }),
  cellToString: data => data?.toString() ?? '',
  cellFromString: data => {
    const num = data ? Number(data) : NaN;
    return {
      value: isNaN(num) ? null : num,
    };
  },
  cellToJson: data => data ?? null,
  isEmpty: data => data == null,
});

numberColumnModelConfig.addConvert('rich-text', (_column, cells) => ({
  column: {},
  cells: cells.map(v => new Text(v?.toString()).yText),
}));

numberColumnModelConfig.addConvert('progress', (_column, cells) => ({
  column: {},
  cells: cells.map(v => clamp(v ?? 0, 0, 100)),
}));
