import type { BlockSpec } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { DividerBlockSchema } from './divider-model.js';

export const DividerBlockSpec: BlockSpec = {
  schema: DividerBlockSchema,
  view: {
    component: literal`affine-divider`,
  },
};
