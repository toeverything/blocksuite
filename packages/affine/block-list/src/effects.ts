import type { ListBlockService } from './list-service.js';

import { ListBlockComponent } from './list-block.js';

export function effects() {
  customElements.define('affine-list', ListBlockComponent);
}

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:list': ListBlockService;
    }
  }
}
