import type { BlockSpec } from '@blocksuite/block-std';

import { DividerBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

export const DividerBlockSpec: BlockSpec = {
  schema: DividerBlockSchema,
  view: {
    component: literal`affine-divider`,
  },
};
