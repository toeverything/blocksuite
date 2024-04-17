import type { ColumnMeta } from '../../database-block/data-view/index.js';
import { columnPresets } from '../../database-block/index.js';
import { richTextColumnConfig } from './rich-text/cell-renderer.js';

export const databaseBlockColumns = [
  columnPresets.dateColumnConfig,
  columnPresets.numberColumnConfig,
  columnPresets.progressColumnConfig,
  columnPresets.selectColumnConfig,
  columnPresets.multiSelectColumnConfig,
  columnPresets.linkColumnConfig,
  columnPresets.checkboxColumnConfig,
  richTextColumnConfig,
];
export const databaseBlockHiddenColumns = [];
const databaseBlockAllColumns = [
  ...databaseBlockColumns,
  ...databaseBlockHiddenColumns,
];
export const databaseBlockAllColumnMap = Object.fromEntries(
  databaseBlockAllColumns.map(v => [v.type, v as ColumnMeta])
);
