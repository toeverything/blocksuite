import type { BlockSpec } from '@blocksuite/block-std';

import { FrameBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

export const FrameBlockSpec: BlockSpec = {
  schema: FrameBlockSchema,
  view: {
    component: literal`affine-frame`,
  },
};
