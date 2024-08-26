import type { ListBlockService } from './list-service.js';

import './list-block.js';

export * from './list-block.js';
export * from './list-service.js';
export * from './list-spec.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:list': ListBlockService;
    }
  }
}
