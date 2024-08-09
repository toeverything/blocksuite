import type { BlockSpec } from '@blocksuite/block-std';

import { EmbedSyncedDocBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import { EmbedSyncedDocBlockService } from './embed-synced-doc-service.js';

export const EmbedSyncedDocBlockSpec: BlockSpec = {
  schema: EmbedSyncedDocBlockSchema,
  view: {
    component: literal`affine-embed-synced-doc-block`,
  },
  service: EmbedSyncedDocBlockService,
};
