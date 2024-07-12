import { BlockModel } from '@blocksuite/store';

import type { EmbedCardStyle } from '../_common/types.js';

import { defineEmbedModel } from '../_common/embed-block-helper/embed-block-model.js';

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

export const EmbedYoutubeStyles: EmbedCardStyle[] = ['video'] as const;

export type EmbedYoutubeBlockProps = {
  style: (typeof EmbedYoutubeStyles)[number];
  url: string;
  caption: string | null;
} & EmbedYoutubeBlockUrlData;

export class EmbedYoutubeModel extends defineEmbedModel<EmbedYoutubeBlockProps>(
  BlockModel
) {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:embed-youtube': EmbedYoutubeModel;
    }
  }
}
