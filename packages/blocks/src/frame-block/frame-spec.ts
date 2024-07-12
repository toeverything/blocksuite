import type { BlockSpec } from '@blocksuite/block-std';

import { literal } from 'lit/static-html.js';

import { FrameBlockSchema } from './frame-model.js';

export const FrameBlockSpec: BlockSpec = {
  schema: FrameBlockSchema,
  view: {
    component: literal`affine-frame`,
  },
};
