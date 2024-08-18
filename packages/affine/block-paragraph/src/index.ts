import type { ParagraphBlockService } from './paragraph-service.js';

import './paragraph-block.js';

export * from './paragraph-block.js';
export * from './paragraph-service.js';
export * from './paragraph-spec.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:paragraph': ParagraphBlockService;
    }
  }
}
