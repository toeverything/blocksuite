import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

export const getNextBlockCommand: Command<
  never,
  'nextBlock',
  {
    path: string[];
  }
> = async (ctx, next) => {
  const path = ctx.path;
  assertExists(path);
  const viewStore = ctx.blockStore.view;
  const nextView = viewStore.findNext(path, nodeView => {
    if (nodeView.type === 'block') {
      return true;
    }
    return;
  });

  if (nextView) {
    await next({ nextBlock: nextView.view as BlockElement });
  }
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      nextBlock?: BlockElement;
    }

    interface Commands {
      getNextBlock: typeof getNextBlockCommand;
    }
  }
}
