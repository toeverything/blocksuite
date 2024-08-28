import type { BlockSpec } from '@blocksuite/block-std';

import { DatabaseBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import { DatabaseBlockService } from './database-service.js';

export const DatabaseBlockSpec: BlockSpec = {
  schema: DatabaseBlockSchema,
  service: DatabaseBlockService,
  view: {
    component: literal`affine-database`,
  },
};
