import type { BlockSpec } from '@blocksuite/block-std';

import { EmbedSyncedDocBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import './embed-edgeless-synced-doc-block.js';
import { EmbedSyncedDocBlockService } from './embed-synced-doc-service.js';

export const EmbedSyncedDocBlockSpec: BlockSpec = {
  schema: EmbedSyncedDocBlockSchema,
  view: {
    component: model => {
      return model.parent?.flavour === 'affine:surface'
        ? literal`affine-embed-edgeless-synced-doc-block`
        : literal`affine-embed-synced-doc-block`;
    },
  },
  service: EmbedSyncedDocBlockService,
};
