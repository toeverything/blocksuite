import type { Command } from '@blocksuite/block-std';

import { assertExists } from '@blocksuite/global/utils';

import type { RootService } from '../../root-block/root-service.js';

export const insertLinkByQuickSearchCommand: Command<
  never,
  'insertedLinkType',
  { userInput?: string; skipSelection?: boolean }
> = (ctx, next) => {
  const rootService = ctx.std.spec.getService('affine:page');
  assertExists(rootService);
  next({
    insertedLinkType: rootService.insertLinkByQuickSearch(
      ctx.userInput,
      ctx.skipSelection
    ),
  });
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      insertedLinkType?: ReturnType<RootService['insertLinkByQuickSearch']>;
    }

    interface Commands {
      insertLinkByQuickSearch: typeof insertLinkByQuickSearchCommand;
    }
  }
}
