import type { BlockSpec } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { SyncedBlockSchema } from './synced-model.js';
import { SyncedService } from './synced-service.js';

export const SyncedBlockSpec: BlockSpec = {
  schema: SyncedBlockSchema,
  view: {
    component: literal`affine-synced`,
  },
  service: SyncedService,
};
