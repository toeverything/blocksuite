import type { EmbedCardStyle } from '@blocksuite/affine-model';
import type { Command } from '@blocksuite/block-std';

import { EmbedOptionProvider } from '@blocksuite/affine-shared/services';

import { insertEmbedCard } from '../../_common/embed-block-helper/insert-embed-card.js';

export const insertBookmarkCommand: Command<
  never,
  'insertedLinkType',
  { url: string }
> = (ctx, next) => {
  const { url, std } = ctx;
  const embedOptions = std.get(EmbedOptionProvider).getEmbedBlockOptions(url);

  let flavour = 'affine:bookmark';
  let targetStyle: EmbedCardStyle = 'vertical';
  const props: Record<string, unknown> = { url };
  if (embedOptions) {
    flavour = embedOptions.flavour;
    targetStyle = embedOptions.styles[0];
  }
  insertEmbedCard(std, { flavour, targetStyle, props });
  next();
};
