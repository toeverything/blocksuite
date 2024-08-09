import type { BlockSpec } from '@blocksuite/block-std';

import { EmbedYoutubeBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import { EmbedYoutubeBlockService } from './embed-youtube-service.js';

export const EmbedYoutubeBlockSpec: BlockSpec = {
  schema: EmbedYoutubeBlockSchema,
  view: {
    component: literal`affine-embed-youtube-block`,
  },
  service: EmbedYoutubeBlockService,
};
