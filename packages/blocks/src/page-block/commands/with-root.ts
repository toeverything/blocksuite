import type { Command } from '@blocksuite/block-std';
import { assertInstanceOf } from '@blocksuite/global/utils';
import { EditorHost } from '@blocksuite/lit';

export const withRootCommand: Command<never, 'root'> = (ctx, next) => {
  const root = ctx.std.root;
  assertInstanceOf(root, EditorHost);

  next({ root });
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      root?: EditorHost;
    }

    interface Commands {
      withRoot: typeof withRootCommand;
    }
  }
}
