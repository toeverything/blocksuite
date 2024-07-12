import { BlockModel } from '@blocksuite/store';

import type { EmbedCardStyle } from '../_common/types.js';

import { defineEmbedModel } from '../_common/embed-block-helper/embed-block-model.js';

export const githubUrlRegex: RegExp =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/(issue|pull)s?\/(\d+)$/;

export type EmbedGithubBlockUrlData = {
  assignees: null | string[];
  createdAt: null | string;
  description: null | string;
  image: null | string;
  status: null | string;
  statusReason: null | string;
  title: null | string;
};

export const EmbedGithubStyles: EmbedCardStyle[] = [
  'vertical',
  'horizontal',
  'list',
  'cube',
] as const;

export type EmbedGithubBlockProps = {
  caption: null | string;
  githubId: string;
  githubType: 'issue' | 'pr';
  owner: string;
  repo: string;
  style: (typeof EmbedGithubStyles)[number];
  url: string;
} & EmbedGithubBlockUrlData;

export class EmbedGithubModel extends defineEmbedModel<EmbedGithubBlockProps>(
  BlockModel
) {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:embed-github': EmbedGithubModel;
    }
  }
}
