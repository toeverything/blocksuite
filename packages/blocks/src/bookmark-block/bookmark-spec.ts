import type { BlockSpec } from '@blocksuite/block-std';

import { BookmarkBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import { BookmarkBlockService } from './bookmark-service.js';
import { commands } from './commands/index.js';

export const BookmarkBlockSpec: BlockSpec = {
  schema: BookmarkBlockSchema,
  view: {
    component: literal`affine-bookmark`,
  },
  commands,
  service: BookmarkBlockService,
};
