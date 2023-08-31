import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

export const getPreviousBlockCommand: Command<{
  path: string[];
}> = (ctx, options) => {
  const path = options?.path;
  assertExists(path);
  const viewStore = ctx.blockStore.viewStore;
  const previousView = viewStore.findPrev(path, nodeView => {
    if (nodeView.type === 'block') {
      return true;
    }
    return;
  });

  if (previousView) {
    const el = previousView.view;
    ctx.data.previousBlock = el as BlockElement;
    return true;
  } else {
    return false;
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
