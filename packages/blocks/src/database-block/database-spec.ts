import { DatabaseBlockSchema } from '@blocksuite/affine-model';
import { type BlockSpec, FlavourExtension } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { DatabaseBlockService } from './database-service.js';

export const DatabaseBlockSpec: BlockSpec = {
  schema: DatabaseBlockSchema,
  view: {
    component: literal`affine-database`,
  },
  extensions: [FlavourExtension('affine:database'), DatabaseBlockService],
};
