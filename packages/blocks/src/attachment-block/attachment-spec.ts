import type { BlockSpec } from '@blocksuite/block-std';

import { AttachmentBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import './attachment-edgeless-block.js';
import { AttachmentBlockService } from './attachment-service.js';

export const AttachmentBlockSpec: BlockSpec = {
  schema: AttachmentBlockSchema,
  view: {
    component: model => {
      return model.doc.getParent(model)?.flavour === 'affine:surface'
        ? literal`affine-edgeless-attachment`
        : literal`affine-attachment`;
    },
  },
  service: AttachmentBlockService,
};
