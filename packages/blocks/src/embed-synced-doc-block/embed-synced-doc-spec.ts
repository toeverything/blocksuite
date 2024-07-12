import type { BlockSpec } from '@blocksuite/block-std';

import { literal } from 'lit/static-html.js';

import { EmbedSyncedDocBlockSchema } from './embed-synced-doc-schema.js';
import { EmbedSyncedDocBlockService } from './embed-synced-doc-service.js';

export const EmbedSyncedDocBlockSpec: BlockSpec = {
  schema: EmbedSyncedDocBlockSchema,
  service: EmbedSyncedDocBlockService,
  view: {
    component: literal`affine-embed-synced-doc-block`,
  },
};
