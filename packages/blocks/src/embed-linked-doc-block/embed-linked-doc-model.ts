import { BlockModel } from '@blocksuite/store';

import { defineEmbedModel } from '../_common/embed-block-helper/index.js';
import type { EmbedCardStyle } from '../_common/types.js';

export const EmbedLinkedDocStyles: EmbedCardStyle[] = [
  'vertical',
  'horizontal',
  'list',
  'cube',
  'horizontalThin',
] as const;

export type EmbedLinkedDocBlockProps = {
  pageId: string;
  style: (typeof EmbedLinkedDocStyles)[number];
  caption: string | null;
};

export class EmbedLinkedDocModel extends defineEmbedModel<EmbedLinkedDocBlockProps>(
  BlockModel
) {}
