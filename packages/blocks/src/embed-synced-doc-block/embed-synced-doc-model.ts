import { BlockModel } from '@blocksuite/store';

import type { EmbedCardStyle } from '../_common/types.js';

import { defineEmbedModel } from '../_common/embed-block-helper/embed-block-model.js';

export const EmbedSyncedDocStyles: EmbedCardStyle[] = ['syncedDoc'];

export type EmbedSyncedDocBlockProps = {
  caption?: null | string;
  pageId: string;
  scale?: number;
  style: EmbedCardStyle;
};

export class EmbedSyncedDocModel extends defineEmbedModel<EmbedSyncedDocBlockProps>(
  BlockModel
) {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:embed-synced-doc': EmbedSyncedDocModel;
    }
  }
}
