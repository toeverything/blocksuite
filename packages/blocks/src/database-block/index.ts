import type { DatabaseBlockModel } from '@blocksuite/affine-model';

import type { DatabaseBlockService } from './database-service.js';

export { richTextColumnConfig } from './columns/rich-text/cell-renderer.js';

export {
  columnPresets,
  viewPresets,
  widgetPresets,
} from './data-view/index.js';
export type { ColumnDataUpdater } from './data-view/types.js';
export * from './database-block.js';
export * from './database-service.js';
declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:database': DatabaseBlockService;
    }
    interface BlockModels {
      'affine:database': DatabaseBlockModel;
    }
  }
}
