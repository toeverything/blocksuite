import type { Command } from '@blocksuite/block-std';

import { QuickSearchProvider } from '@blocksuite/affine-shared/services';

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

  const insertedLinkType = quickSearchService.openQuickSearch().then(result => {
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
    if ('userInput' in result) {
      std.command.exec('insertBookmark', { url: result.externalUrl });
      return {
        flavour: 'affine:bookmark',
      };
    }

    return null;
  });

  next({ insertedLinkType });
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      insertedLinkType?: Promise<{
        flavour?: string;
      } | null>;
    }

    interface Commands {
      insertLinkByQuickSearch: typeof insertLinkByQuickSearchCommand;
    }
  }
}
