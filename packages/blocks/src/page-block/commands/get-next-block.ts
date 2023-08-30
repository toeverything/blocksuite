import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

export const getNextBlockCommand: Command<{
  path: string[];
}> = (ctx, options) => {
  const path = options?.path;
  assertExists(path);
  const viewStore = ctx.blockStore.viewStore;
  const nextView = viewStore.findNext(path, nodeView => {
    if (nodeView.type === 'block') {
      return true;
    }
    return;
  });

  if (nextView) {
    const el = nextView.view;
    ctx.data.nextBlock = el as BlockElement;
    return true;
  } else {
    return false;
  }
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace BlockSuite {
    interface CommandData {
      nextBlock?: BlockElement;
    }

    interface Commands {
      getNextBlock: typeof getNextBlockCommand;
    }
  }
}
