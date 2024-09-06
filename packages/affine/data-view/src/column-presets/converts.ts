import { clamp } from '@blocksuite/affine-shared/utils';

import { createColumnConvert } from '../core/index.js';
import { multiSelectColumnModelConfig } from './multi-select/define.js';
import { numberColumnModelConfig } from './number/define.js';
import { progressColumnModelConfig } from './progress/define.js';
import { selectColumnModelConfig } from './select/define.js';

export const presetColumnConverts = [
  createColumnConvert(
    multiSelectColumnModelConfig,
    selectColumnModelConfig,
    (column, cells) => ({
      column,
      cells: cells.map(v => v?.[0]),
    })
  ),
  createColumnConvert(
    numberColumnModelConfig,
    progressColumnModelConfig,
    (_column, cells) => ({
      column: {},
      cells: cells.map(v => clamp(v ?? 0, 0, 100)),
    })
  ),
  createColumnConvert(
    progressColumnModelConfig,
    numberColumnModelConfig,
    (_column, cells) => ({
      column: {
        decimal: 0,
        format: 'number' as const,
      },
      cells: cells.map(v => v),
    })
  ),
  createColumnConvert(
    selectColumnModelConfig,
    multiSelectColumnModelConfig,
    (column, cells) => ({
      column,
      cells: cells.map(v => (v ? [v] : undefined)),
    })
  ),
];
