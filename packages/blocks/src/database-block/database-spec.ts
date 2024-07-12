import type { BlockSpec } from '@blocksuite/block-std';

import { literal } from 'lit/static-html.js';

import { DatabaseBlockSchema } from './database-model.js';
import { DatabaseBlockService } from './database-service.js';

export const DatabaseBlockSpec: BlockSpec = {
  schema: DatabaseBlockSchema,
  service: DatabaseBlockService,
  view: {
    component: literal`affine-database`,
  },
};
