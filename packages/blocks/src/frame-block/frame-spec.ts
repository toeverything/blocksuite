import { FrameBlockSchema } from '@blocksuite/affine-model';
import { type BlockSpec, FlavourExtension } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { FrameBlockService } from './frame-service.js';

export const FrameBlockSpec: BlockSpec = {
  schema: FrameBlockSchema,
  view: {
    component: literal`affine-frame`,
  },
  extensions: [FlavourExtension('affine:frame'), FrameBlockService],
};
