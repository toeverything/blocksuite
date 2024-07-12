import type { BlockSpec } from '@blocksuite/block-std';

import { literal } from 'lit/static-html.js';

import { AttachmentBlockSchema } from './attachment-model.js';
import { AttachmentBlockService } from './attachment-service.js';

export const AttachmentBlockSpec: BlockSpec = {
  schema: AttachmentBlockSchema,
  service: AttachmentBlockService,
  view: {
    component: literal`affine-attachment`,
  },
};
