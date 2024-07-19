import { BlockModel } from '@blocksuite/store';

import type { EmbedCardStyle } from '../_common/types.js';

import { defineEmbedModel } from '../_common/embed-block-helper/embed-block-model.js';

export const loomUrlRegex: RegExp =
  /(?:https?:\/\/)??(?:www\.)?loom\.com\/share\/([a-zA-Z0-9]+)/;

export type EmbedLoomBlockUrlData = {
  videoId: string | null;
  image: string | null;
  title: string | null;
  description: string | null;
};

export const EmbedLoomStyles: EmbedCardStyle[] = ['video'] as const;

export type EmbedLoomBlockProps = {
  style: (typeof EmbedLoomStyles)[number];
  url: string;
  caption: string | null;
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
