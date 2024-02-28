import type { Command } from '@blocksuite/block-std';
import { assertInstanceOf } from '@blocksuite/global/utils';
import { EditorHost } from '@blocksuite/lit';

export const withHostCommand: Command<never, 'host'> = (ctx, next) => {
  const host = ctx.std.host;
  assertInstanceOf(host, EditorHost);

  next({ host });
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      host?: EditorHost;
    }

    interface Commands {
      withHost: typeof withHostCommand;
    }
  }
}
