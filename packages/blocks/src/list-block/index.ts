import type { ListBlockModel } from './list-model.js';
import type { ListBlockService } from './list-service.js';

export * from './list-block.js';
export * from './list-model.js';
export * from './list-service.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:list': ListBlockModel;
    }
    interface BlockServices {
      'affine:list': ListBlockService;
    }
  }
}
