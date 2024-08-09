import type { BlockSpec } from '@blocksuite/block-std';

import { EmbedLoomBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import { EmbedLoomBlockService } from './embed-loom-service.js';

export const EmbedLoomBlockSpec: BlockSpec = {
  schema: EmbedLoomBlockSchema,
  view: {
    component: literal`affine-embed-loom-block`,
  },
  service: EmbedLoomBlockService,
};
