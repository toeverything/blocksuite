import { noop } from '@blocksuite/global/utils';

import { EmbedSyncedDocBlockComponent } from './embed-synced-doc-block.js';
import type { EmbedSyncedDocService } from './embed-synced-doc-service.js';

noop(EmbedSyncedDocBlockComponent);

export * from './embed-synced-doc-block.js';
export * from './embed-synced-doc-model.js';
export * from './embed-synced-doc-service.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:embed-synced-doc': EmbedSyncedDocService;
    }
  }
}
