import { BlockModel } from '@blocksuite/store';

import { defineEmbedModel } from '../_common/embed-block-helper/embed-block-model.js';
import type { EmbedCardStyle } from '../_common/types.js';

export const EmbedSyncedDocStyles: EmbedCardStyle[] = ['syncedDoc'] as const;

export type EmbedSyncedDocBlockProps = {
  pageId: string;
  style: (typeof EmbedSyncedDocStyles)[number];
  caption?: string;
  scale?: number;
};

export class EmbedSyncedDocModel extends defineEmbedModel<EmbedSyncedDocBlockProps>(
  BlockModel
) {}
