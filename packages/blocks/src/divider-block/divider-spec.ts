import { DividerBlockSchema } from '@blocksuite/affine-model';
import { type BlockSpec, FlavourExtension } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { DividerBlockService } from './divider-service.js';

export const DividerBlockSpec: BlockSpec = {
  schema: DividerBlockSchema,
  view: {
    component: literal`affine-divider`,
  },
  extensions: [FlavourExtension('affine:divider'), DividerBlockService],
};
