import { noop } from '@blocksuite/global/utils';

import { EmbedLinkedDocBlockComponent } from './embed-linked-doc-block.js';
import type { EmbedLinkedDocService } from './embed-linked-doc-service.js';
noop(EmbedLinkedDocBlockComponent);

export * from './embed-linked-doc-block.js';
export * from './embed-linked-doc-model.js';
export * from './embed-linked-doc-service.js';
export * from './embed-linked-doc-spec.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:embed-linked-doc': EmbedLinkedDocService;
    }
  }
}
