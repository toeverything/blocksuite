import type { CellBlockModel } from '@blocksuite/affine-model';

import type { CellBlockService } from './cell-service.js';

export * from './cell-block.js';
export * from './cell-service.js';
declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:cell': CellBlockService;
    }
    interface BlockModels {
      'affine:cell': CellBlockModel;
    }
  }
}
