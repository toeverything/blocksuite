import type { BlockSpec } from '@blocksuite/block-std';

import { EmbedGithubBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import { EmbedGithubBlockService } from './embed-github-service.js';

export const EmbedGithubBlockSpec: BlockSpec = {
  schema: EmbedGithubBlockSchema,
  view: {
    component: literal`affine-embed-github-block`,
  },
  service: EmbedGithubBlockService,
};
