import type { DatabaseBlockModel } from '@blocksuite/affine-model';

import type { DatabaseBlockService } from './database-service.js';

export { databaseBlockColumns } from './columns/index.js';

export type { DatabaseOptionsConfig } from './config.js';
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
