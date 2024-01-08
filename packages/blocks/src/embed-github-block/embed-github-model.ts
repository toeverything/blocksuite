import { BlockModel } from '@blocksuite/store';

import { defineEmbedModel } from '../_common/embed-block-helper/index.js';
import type { LinkCardStyle } from '../_common/types.js';

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

export const EmbedGithubStyles: LinkCardStyle[] = [
  'horizontal',
  'list',
  'vertical',
  'cube',
] as const;

export type EmbedGithubBlockProps = {
  style: (typeof EmbedGithubStyles)[number];
  owner: string;
  repo: string;
  type: 'issue' | 'pr';
  githubId: string;
  url: string;
  caption: string | null;
} & EmbedGithubBlockUrlData;

export class EmbedGithubModel extends defineEmbedModel<EmbedGithubBlockProps>(
  BlockModel
) {}
