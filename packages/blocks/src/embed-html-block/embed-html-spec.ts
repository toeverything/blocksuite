import type { BlockSpec } from '@blocksuite/block-std';

import { literal } from 'lit/static-html.js';

import { EmbedHtmlBlockSchema } from './embed-html-schema.js';
import { EmbedHtmlBlockService } from './embed-html-service.js';

export const EmbedHtmlBlockSpec: BlockSpec = {
  schema: EmbedHtmlBlockSchema,
  view: {
    component: literal`affine-embed-html-block`,
  },
  service: EmbedHtmlBlockService,
};
