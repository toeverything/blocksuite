import type { ParagraphBlockService } from './paragraph-service.js';

import { ParagraphBlockComponent } from './paragraph-block.js';

export function effects() {
  customElements.define('affine-paragraph', ParagraphBlockComponent);
}

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:paragraph': ParagraphBlockService;
    }
  }
}
