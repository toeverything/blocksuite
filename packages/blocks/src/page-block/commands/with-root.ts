import type { Command } from '@blocksuite/block-std';
import { assertInstanceOf } from '@blocksuite/global/utils';
import { BlockSuiteRoot } from '@blocksuite/lit';

export const withRootCommand: Command<never, 'root'> = (ctx, next) => {
  const root = ctx.std.root;
  assertInstanceOf(root, BlockSuiteRoot);

  next({ root });
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      root?: BlockSuiteRoot;
    }

    interface Commands {
      withRoot: typeof withRootCommand;
    }
  }
}
