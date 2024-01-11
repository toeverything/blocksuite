import { BlockModel } from '@blocksuite/store';

import { defineEmbedModel } from '../_common/embed-block-helper/index.js';
import type { EmbedCardStyle } from '../_common/types.js';

export const EmbedLinkedPageStyles: EmbedCardStyle[] = [
  'vertical',
  'horizontal',
  'list',
  'cube',
] as const;

export type EmbedLinkedPageBlockProps = {
  pageId: string;
  style: (typeof EmbedLinkedPageStyles)[number];
  caption: string | null;
};

export class EmbedLinkedPageModel extends defineEmbedModel<EmbedLinkedPageBlockProps>(
  BlockModel
) {}
