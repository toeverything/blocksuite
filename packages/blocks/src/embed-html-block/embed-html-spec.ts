import type { BlockSpec } from '@blocksuite/block-std';

import { EmbedHtmlBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import './embed-edgeless-html-block.js';
import { EmbedHtmlBlockService } from './embed-html-service.js';

export const EmbedHtmlBlockSpec: BlockSpec = {
  schema: EmbedHtmlBlockSchema,
  view: {
    component: model => {
      return model.parent?.flavour === 'affine:surface'
        ? literal`affine-embed-edgeless-html-block`
        : literal`affine-embed-html-block`;
    },
  },
  service: EmbedHtmlBlockService,
};
