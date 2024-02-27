import type { ColumnsBlockModel } from './columns-model.js';

export * from './columns-block.js';
export * from './columns-model.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:columns': ColumnsBlockModel;
    }
  }
}
