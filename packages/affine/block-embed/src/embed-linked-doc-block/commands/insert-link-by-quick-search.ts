import type { Command } from '@blocksuite/block-std';

import { QuickSearchProvider } from '@blocksuite/affine-shared/services';

export type InsertedLinkType = {
  flavour?: 'affine:bookmark' | 'affine:embed-linked-doc';
} | null;

export const insertLinkByQuickSearchCommand: Command<
  never,
  'insertedLinkType'
> = (ctx, next) => {
  const { std } = ctx;
  const quickSearchService = std.getOptional(QuickSearchProvider);
  if (!quickSearchService) {
    next();
    return;
  }

  const insertedLinkType: Promise<InsertedLinkType> = quickSearchService
    .openQuickSearch()
    .then(result => {
      if (!result) return null;

      // add linked doc
      if ('docId' in result) {
        std.command.exec('insertEmbedLinkedDoc', {
          docId: result.docId,
          params: result.params,
        });
        return {
          flavour: 'affine:embed-linked-doc',
        };
      }

      // add normal link;
      if ('externalUrl' in result) {
        // @ts-ignore TODO: fix after bookmark refactor
        std.command.exec('insertBookmark', { url: result.externalUrl });
        return {
          flavour: 'affine:bookmark',
        };
      }

      return null;
    });

  next({ insertedLinkType });
};
