import type { DatabaseBlockModel } from '@blocksuite/affine-model';

export { databaseBlockColumns } from './columns/index.js';

export type { DatabaseOptionsConfig } from './config.js';
export * from './database-block.js';
export * from './database-service.js';
declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:database': DatabaseBlockModel;
    }
  }
}
