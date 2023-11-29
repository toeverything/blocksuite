import { literal } from 'lit/static-html.js';

import { embedBlockGenerator } from '../_common/embed-block-generator/index.js';
import { EmbedGithubBlockModel } from './embed-github-model.js';

export const embedGithubBlockSpec = embedBlockGenerator({
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
