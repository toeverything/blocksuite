import type { PropertyMetaConfig } from '@blocksuite/data-view';

import { propertyPresets } from '@blocksuite/data-view/property-presets';

import { linkColumnConfig } from './link/cell-renderer.js';
import { richTextColumnConfig } from './rich-text/cell-renderer.js';
import { titleColumnConfig } from './title/cell-renderer.js';

export * from './converts.js';
const {
  checkboxPropertyConfig,
  datePropertyConfig,
  multiSelectPropertyConfig,
  numberPropertyConfig,
  progressPropertyConfig,
  selectPropertyConfig,
} = propertyPresets;
export const microsheetBlockColumns = {
  checkboxColumnConfig: checkboxPropertyConfig,
  dateColumnConfig: datePropertyConfig,
  multiSelectColumnConfig: multiSelectPropertyConfig,
  numberColumnConfig: numberPropertyConfig,
  progressColumnConfig: progressPropertyConfig,
  selectColumnConfig: selectPropertyConfig,
  linkColumnConfig,
  richTextColumnConfig,
};
export const microsheetBlockPropertyList = Object.values(
  microsheetBlockColumns
);
export const microsheetBlockHiddenColumns = [
  propertyPresets.imagePropertyConfig,
  titleColumnConfig,
];
const microsheetBlockAllColumns = [
  ...microsheetBlockPropertyList,
  ...microsheetBlockHiddenColumns,
];
export const microsheetBlockAllPropertyMap = Object.fromEntries(
  microsheetBlockAllColumns.map(v => [v.type, v as PropertyMetaConfig])
);
