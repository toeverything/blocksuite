import type { BlockSpec } from '@blocksuite/block-std';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { EMBED_CARD_TOOLBAR } from '../root-block/widgets/embed-card-toolbar/embed-card-toolbar.js';
import { BookmarkBlockSchema } from './bookmark-model.js';
import { BookmarkBlockService } from './bookmark-service.js';

export const BookmarkBlockSpec: BlockSpec = {
  schema: BookmarkBlockSchema,
  view: {
    component: literal`affine-bookmark`,
    widgets: {
      [EMBED_CARD_TOOLBAR]: literal`${unsafeStatic(EMBED_CARD_TOOLBAR)}`,
    },
  },
  service: BookmarkBlockService,
};
