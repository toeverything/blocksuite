import { BlockModel } from '@blocksuite/store';

import type { EmbedCardStyle } from '../_common/types.js';

import { defineEmbedModel } from '../_common/embed-block-helper/embed-block-model.js';

export const loomUrlRegex: RegExp =
  /(?:https?:\/\/)??(?:www\.)?loom\.com\/share\/([a-zA-Z0-9]+)/;

export type EmbedLoomBlockUrlData = {
  description: null | string;
  image: null | string;
  title: null | string;
  videoId: null | string;
};

export const EmbedLoomStyles: EmbedCardStyle[] = ['video'] as const;

export type EmbedLoomBlockProps = {
  caption: null | string;
  style: (typeof EmbedLoomStyles)[number];
  url: string;
} & EmbedLoomBlockUrlData;

export class EmbedLoomModel extends defineEmbedModel<EmbedLoomBlockProps>(
  BlockModel
) {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:embed-loom': EmbedLoomModel;
    }
  }
}
