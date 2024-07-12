import type { BlockSpec } from '@blocksuite/block-std';

import { literal } from 'lit/static-html.js';

import { EmbedFigmaBlockSchema } from './embed-figma-schema.js';
import { EmbedFigmaBlockService } from './embed-figma-service.js';

export const EmbedFigmaBlockSpec: BlockSpec = {
  schema: EmbedFigmaBlockSchema,
  view: {
    component: literal`affine-embed-figma-block`,
  },
  service: EmbedFigmaBlockService,
};
