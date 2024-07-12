import { createEmbedBlockSchema } from '../_common/embed-block-helper/helper.js';
import {
  type EmbedGithubBlockProps,
  EmbedGithubModel,
  EmbedGithubStyles,
} from './embed-github-model.js';

const defaultEmbedGithubProps: EmbedGithubBlockProps = {
  assignees: null,
  caption: null,
  createdAt: null,
  description: null,
  githubId: '',
  githubType: 'issue',
  image: null,

  owner: '',
  repo: '',
  status: null,
  statusReason: null,
  style: EmbedGithubStyles[1],
  title: null,
  url: '',
};

export const EmbedGithubBlockSchema = createEmbedBlockSchema({
  name: 'github',
  props: (): EmbedGithubBlockProps => defaultEmbedGithubProps,
  toModel: () => new EmbedGithubModel(),
  version: 1,
});
