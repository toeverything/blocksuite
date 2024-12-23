import type { PropertyMetaConfig } from '@blocksuite/microsheet-data-view';

import { propertyPresets } from '@blocksuite/microsheet-data-view/property-presets';

import { richTextColumnConfig } from '../../database-block/properties/rich-text/cell-renderer.js';

export const queryBlockColumns = [propertyPresets.textPropertyConfig];
export const queryBlockHiddenColumns = [richTextColumnConfig];
const queryBlockAllColumns = [...queryBlockColumns, ...queryBlockHiddenColumns];
export const queryBlockAllColumnMap = Object.fromEntries(
  queryBlockAllColumns.map(v => [v.type, v as PropertyMetaConfig])
);
