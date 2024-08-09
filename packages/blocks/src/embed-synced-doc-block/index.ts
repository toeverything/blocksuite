import { noop } from '@blocksuite/global/utils';

import type { EmbedSyncedDocBlockService } from './embed-synced-doc-service.js';

import { EmbedSyncedDocBlockComponent } from './embed-synced-doc-block.js';

noop(EmbedSyncedDocBlockComponent);

export * from './embed-synced-doc-block.js';
export * from './embed-synced-doc-service.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:embed-synced-doc': EmbedSyncedDocBlockService;
    }
  }
}
