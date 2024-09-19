import type { ColumnMeta } from '@blocksuite/data-view';

import { columnPresets } from '@blocksuite/data-view/column-presets';

import { linkColumnConfig } from './link/cell-renderer.js';
import { richTextColumnConfig } from './rich-text/cell-renderer.js';
import { titleColumnConfig } from './title/cell-renderer.js';

export * from './converts.js';
const {
  checkboxColumnConfig,
  dateColumnConfig,
  multiSelectColumnConfig,
  numberColumnConfig,
  progressColumnConfig,
  selectColumnConfig,
} = columnPresets;
export const databaseBlockColumns = {
  checkboxColumnConfig,
  dateColumnConfig,
  multiSelectColumnConfig,
  numberColumnConfig,
  progressColumnConfig,
  selectColumnConfig,
  linkColumnConfig,
  richTextColumnConfig,
};
export const databaseBlockColumnList = Object.values(databaseBlockColumns);
export const databaseBlockHiddenColumns = [
  columnPresets.imageColumnConfig,
  titleColumnConfig,
];
const databaseBlockAllColumns = [
  ...databaseBlockColumnList,
  ...databaseBlockHiddenColumns,
];
export const databaseBlockAllColumnMap = Object.fromEntries(
  databaseBlockAllColumns.map(v => [v.type, v as ColumnMeta])
);
