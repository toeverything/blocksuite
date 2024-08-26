import type { BlockSpec } from '@blocksuite/block-std';

import { EmbedYoutubeBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import './embed-edgeless-youtube-block.js';
import { EmbedYoutubeBlockService } from './embed-youtube-service.js';

export const EmbedYoutubeBlockSpec: BlockSpec = {
  schema: EmbedYoutubeBlockSchema,
  view: {
    component: model => {
      return model.parent?.flavour === 'affine:surface'
        ? literal`affine-embed-edgeless-youtube-block`
        : literal`affine-embed-youtube-block`;
    },
  },
  service: EmbedYoutubeBlockService,
};
