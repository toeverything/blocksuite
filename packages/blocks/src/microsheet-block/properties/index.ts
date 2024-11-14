import type { PropertyMetaConfig } from '@blocksuite/microsheet-data-view';

import { richTextColumnConfig } from './rich-text/cell-renderer.js';
import { titleColumnConfig } from './title/cell-renderer.js';

export const microsheetBlockColumns = {
  richTextColumnConfig,
};
export const microsheetBlockPropertyList = Object.values(
  microsheetBlockColumns
);
export const microsheetBlockHiddenColumns = [titleColumnConfig];
const microsheetBlockAllColumns = [
  ...microsheetBlockPropertyList,
  ...microsheetBlockHiddenColumns,
];
export const microsheetBlockAllPropertyMap = Object.fromEntries(
  microsheetBlockAllColumns.map(v => [v.type, v as PropertyMetaConfig])
);
