import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

export const getPreviousBlockCommand: Command<
  never,
  'previousBlock',
  {
    path: string[];
  }
> = async (ctx, next) => {
  const path = ctx.path;
  assertExists(path);
  const viewStore = ctx.blockStore.viewStore;
  const previousView = viewStore.findPrev(path, nodeView => {
    if (nodeView.type === 'block') {
      return true;
    }
    return;
  });

  if (previousView) {
    await next({ previousBlock: previousView.view as BlockElement });
  }
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      previousBlock?: BlockElement;
    }

    interface Commands {
      getPreviousBlock: typeof getPreviousBlockCommand;
    }
  }
}
