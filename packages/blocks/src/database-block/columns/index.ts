import type { ColumnMeta } from '../data-view/index.js';

import { columnPresets } from '../data-view/index.js';
import { richTextColumnConfig } from './rich-text/cell-renderer.js';
import { titleColumnConfig } from './title/cell-renderer.js';

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
export const databaseBlockHiddenColumns = [
  columnPresets.imageColumnConfig,
  titleColumnConfig,
];
const databaseBlockAllColumns = [
  ...databaseBlockColumns,
  ...databaseBlockHiddenColumns,
];
export const databaseBlockAllColumnMap = Object.fromEntries(
  databaseBlockAllColumns.map(v => [v.type, v as ColumnMeta])
);
