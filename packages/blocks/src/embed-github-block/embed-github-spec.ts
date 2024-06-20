import { literal } from 'lit/static-html.js';

import { createEmbedBlock } from '../_common/embed-block-helper/index.js';
import {
  type EmbedGithubBlockProps,
  EmbedGithubModel,
  EmbedGithubStyles,
} from './embed-github-model.js';
import { EmbedGithubBlockService } from './embed-github-service.js';

const defaultEmbedGithubProps: EmbedGithubBlockProps = {
  style: EmbedGithubStyles[1],
  owner: '',
  repo: '',
  githubType: 'issue',
  githubId: '',
  url: '',
  caption: null,

  image: null,
  status: null,
  statusReason: null,
  title: null,
  description: null,
  createdAt: null,
  assignees: null,
};

export const EmbedGithubBlockSpec = createEmbedBlock({
  schema: {
    name: 'github',
    version: 1,
    toModel: () => new EmbedGithubModel(),
    props: (): EmbedGithubBlockProps => defaultEmbedGithubProps,
  },
  view: {
    component: literal`affine-embed-github-block`,
  },
  service: EmbedGithubBlockService,
});
