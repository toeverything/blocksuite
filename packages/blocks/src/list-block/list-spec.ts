import type { BlockSpec } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { ListBlockSchema } from './list-model.js';
import { ListBlockService } from './list-service.js';

export const ListBlockSpec: BlockSpec = {
  schema: ListBlockSchema,
  view: {
    component: literal`affine-list`,
  },
  service: ListBlockService,
};
