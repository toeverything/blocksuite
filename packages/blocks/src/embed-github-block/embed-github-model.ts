import { BlockModel } from '@blocksuite/store';

import type { EmbedCardStyle } from '../_common/types.js';

import { defineEmbedModel } from '../_common/embed-block-helper/embed-block-model.js';

export const githubUrlRegex: RegExp =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/(issue|pull)s?\/(\d+)$/;

export type EmbedGithubBlockUrlData = {
  image: string | null;
  status: string | null;
  statusReason: string | null;
  title: string | null;
  description: string | null;
  createdAt: string | null;
  assignees: string[] | null;
};

export const EmbedGithubStyles: EmbedCardStyle[] = [
  'vertical',
  'horizontal',
  'list',
  'cube',
] as const;

export type EmbedGithubBlockProps = {
  style: (typeof EmbedGithubStyles)[number];
  owner: string;
  repo: string;
  githubType: 'issue' | 'pr';
  githubId: string;
  url: string;
  caption: string | null;
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
