import { BlockModel } from '@blocksuite/store';

import type { EmbedCardStyle } from '../_common/types.js';

import { defineEmbedModel } from '../_common/embed-block-helper/embed-block-model.js';

export const youtubeUrlRegex: RegExp =
  /(?:https?:\/\/)?(?:(?:www|m)\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/;

export type EmbedYoutubeBlockUrlData = {
  creator: null | string;
  creatorImage: null | string;
  creatorUrl: null | string;
  description: null | string;
  image: null | string;
  title: null | string;
  videoId: null | string;
};

export const EmbedYoutubeStyles: EmbedCardStyle[] = ['video'] as const;

export type EmbedYoutubeBlockProps = {
  caption: null | string;
  style: (typeof EmbedYoutubeStyles)[number];
  url: string;
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
