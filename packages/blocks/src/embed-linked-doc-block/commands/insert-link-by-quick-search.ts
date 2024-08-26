import type { Command } from '@blocksuite/block-std';

export const insertLinkByQuickSearchCommand: Command<
  never,
  'insertedLinkType',
  { userInput?: string; skipSelection?: boolean }
> = (ctx, next) => {
  const { userInput, skipSelection, std } = ctx;
  const rootService = std.spec.getService('affine:page');
  const quickSearchService = rootService?.quickSearchService;
  if (!quickSearchService) {
    next();
    return;
  }

  const insertedLinkType = quickSearchService
    .searchDoc({
      action: 'insert',
      userInput,
      skipSelection,
    })
    .then(result => {
      // add linked doc
      if (result && 'docId' in result) {
        std.command.exec('insertEmbedLinkedDoc', { docId: result.docId });
        return {
          flavour: 'affine:embed-linked-doc',
          isNewDoc: !!result.isNewDoc,
        };
      }

      // add normal link;
      if (result && 'userInput' in result) {
        std.command.exec('insertBookmark', { url: result.userInput });
        return {
          flavour: 'affine:bookmark',
        };
      }
      return {};
    });

  next({ insertedLinkType });
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      insertedLinkType?: Promise<{
        flavour?: string;
        isNewDoc?: boolean;
      }>;
    }

    interface Commands {
      insertLinkByQuickSearch: typeof insertLinkByQuickSearchCommand;
    }
  }
}
