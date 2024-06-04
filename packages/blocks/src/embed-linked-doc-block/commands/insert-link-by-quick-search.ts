import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

export const insertLinkByQuickSearchCommand: Command<
  never,
  never,
  { userInput?: string; skipSelection?: boolean }
> = (ctx, next) => {
  const rootService = ctx.std.spec.getService('affine:page');
  assertExists(rootService);
  void rootService.insertLinkByQuickSearch(ctx.userInput, ctx.skipSelection);
  next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      insertLinkByQuickSearch: typeof insertLinkByQuickSearchCommand;
    }
  }
}
