import type { BlockSpec } from '@blocksuite/block-std';

import { EmbedGithubBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import './embed-edgeless-github-block.js';
import { EmbedGithubBlockService } from './embed-github-service.js';

export const EmbedGithubBlockSpec: BlockSpec = {
  schema: EmbedGithubBlockSchema,
  view: {
    component: model => {
      return model.parent?.flavour === 'affine:surface'
        ? literal`affine-embed-edgeless-github-block`
        : literal`affine-embed-github-block`;
    },
  },
  service: EmbedGithubBlockService,
};
