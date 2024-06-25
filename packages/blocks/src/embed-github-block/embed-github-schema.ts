import { createEmbedBlockSchema } from '../_common/embed-block-helper/helper.js';
import {
  type EmbedGithubBlockProps,
  EmbedGithubModel,
  EmbedGithubStyles,
} from './embed-github-model.js';

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

export const EmbedGithubBlockSchema = createEmbedBlockSchema({
  name: 'github',
  version: 1,
  toModel: () => new EmbedGithubModel(),
  props: (): EmbedGithubBlockProps => defaultEmbedGithubProps,
});
