import type { RowBlockModel } from '@blocksuite/affine-model';

import type { RowBlockService } from './row-service.js';

export * from './row-block.js';
export * from './row-service.js';
declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:row': RowBlockService;
    }
    interface BlockModels {
      'affine:row': RowBlockModel;
    }
  }
}
