import type { BlockSpec } from '@blocksuite/block-std';

import { literal } from 'lit/static-html.js';

import { EmbedGithubBlockSchema } from './embed-github-schema.js';
import { EmbedGithubBlockService } from './embed-github-service.js';

export const EmbedGithubBlockSpec: BlockSpec = {
  schema: EmbedGithubBlockSchema,
  view: {
    component: literal`affine-embed-github-block`,
  },
  service: EmbedGithubBlockService,
};
