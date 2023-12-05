import { literal } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/index.js';
import { EmbedGithubBlockModel } from './embed-github-model.js';

export const EmbedGithubBlockSpec = createEmbedBlock({
  schema: {
    name: 'github',
    version: 1,
    toModel: () => new EmbedGithubBlockModel(),
    props: () => ({
      owner: '',
      repo: '',
    }),
  },
  view: {
    component: literal`affine-embed-github-block`,
  },
});
