import type { ColumnMeta } from '../../database-block/data-view/index.js';
import { columnPresets } from '../../database-block/index.js';
import { richTextColumnConfig } from './rich-text/cell-renderer.js';

export const queryBlockColumns = [
  columnPresets.dateColumnConfig,
  columnPresets.numberColumnConfig,
  columnPresets.progressColumnConfig,
  columnPresets.selectColumnConfig,
  columnPresets.multiSelectColumnConfig,
  columnPresets.linkColumnConfig,
  columnPresets.checkboxColumnConfig,
];
export const queryBlockHiddenColumns = [richTextColumnConfig];
const queryBlockAllColumns = [...queryBlockColumns, ...queryBlockHiddenColumns];
export const queryBlockAllColumnMap = Object.fromEntries(
  queryBlockAllColumns.map(v => [v.type, v as ColumnMeta])
);
