import type { DatabaseBlockModel } from '@blocksuite/affine-model';

export type { DatabaseOptionsConfig } from './config.js';

export * from './data-source.js';
export * from './database-block.js';
export * from './database-service.js';
export { databaseBlockColumns } from './properties/index.js';
declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:database': DatabaseBlockModel;
    }
  }
}
