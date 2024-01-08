import { BlockModel } from '@blocksuite/store';

import { defineEmbedModel } from '../_common/embed-block-helper/index.js';
import type { LinkCardStyle } from '../_common/types.js';

export const youtubeUrlRegex: RegExp =
  /(?:https?:\/\/)?(?:(?:www|m)\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/;

export type EmbedYoutubeBlockUrlData = {
  videoId: string | null;
  image: string | null;
  title: string | null;
  description: string | null;
  creator: string | null;
  creatorUrl: string | null;
  creatorImage: string | null;
};

export const EmbedYoutubeStyles: LinkCardStyle[] = ['vertical'] as const;

export type EmbedYoutubeBlockProps = {
  style: (typeof EmbedYoutubeStyles)[number];
  url: string;
  caption: string | null;
} & EmbedYoutubeBlockUrlData;

export class EmbedYoutubeModel extends defineEmbedModel<EmbedYoutubeBlockProps>(
  BlockModel
) {}
