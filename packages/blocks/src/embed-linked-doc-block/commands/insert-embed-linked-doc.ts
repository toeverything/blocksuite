import type { EmbedCardStyle, ReferenceParams } from '@blocksuite/affine-model';
import type { Command } from '@blocksuite/block-std';

import { insertEmbedCard } from '../../_common/embed-block-helper/insert-embed-card.js';

export const insertEmbedLinkedDocCommand: Command<
  never,
  'insertedLinkType',
  {
    docId: string;
    params?: ReferenceParams;
  }
> = (ctx, next) => {
  const { docId, params, std } = ctx;
  const flavour = 'affine:embed-linked-doc';
  const targetStyle: EmbedCardStyle = 'vertical';
  const props: Record<string, unknown> = { pageId: docId };
  if (params) props.params = params;
  insertEmbedCard(std, { flavour, targetStyle, props });
  next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      insertEmbedLinkedDoc: typeof insertEmbedLinkedDocCommand;
    }
  }
}
