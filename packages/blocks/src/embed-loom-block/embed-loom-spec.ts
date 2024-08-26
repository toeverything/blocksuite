import type { BlockSpec } from '@blocksuite/block-std';

import { EmbedLoomBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import './embed-edgeless-loom-bock.js';
import { EmbedLoomBlockService } from './embed-loom-service.js';

export const EmbedLoomBlockSpec: BlockSpec = {
  schema: EmbedLoomBlockSchema,
  view: {
    component: model => {
      return model.parent?.flavour === 'affine:surface'
        ? literal`affine-embed-edgeless-loom-block`
        : literal`affine-embed-loom-block`;
    },
  },
  service: EmbedLoomBlockService,
};
