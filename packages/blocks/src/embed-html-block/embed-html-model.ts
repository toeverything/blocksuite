import { BlockModel } from '@blocksuite/store';

import { defineEmbedModel } from '../_common/embed-block-helper/embed-block-model.js';
import type { EmbedCardStyle } from '../_common/types.js';

export const EmbedHtmlStyles: EmbedCardStyle[] = ['html'] as const;

export type EmbedHtmlBlockProps = {
  style: (typeof EmbedHtmlStyles)[number];
  caption: string | null;
  html?: string;
  design?: string;
};

export class EmbedHtmlModel extends defineEmbedModel<EmbedHtmlBlockProps>(
  BlockModel
) {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:embed-html': EmbedHtmlModel;
    }
  }
}
