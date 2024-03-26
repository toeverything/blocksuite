import type { Command } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

export const getBlockIndexCommand: Command<
  'currentSelectionPath',
  'blockIndex' | 'parentBlock',
  {
    path?: string[];
  }
> = (ctx, next) => {
  const path = ctx.path ?? ctx.currentSelectionPath;
  assertExists(
    path,
    '`path` is required, you need to pass it in args or ctx before adding this command to the pipeline.'
  );

  const parent = ctx.std.view.getParent(path);
  if (!parent) {
    return;
  }
  const index = parent.childBlockElements.findIndex(x => {
    return PathFinder.equals(x.path, path);
  });

  next({
    blockIndex: index,
    parentBlock: parent as BlockElement,
  });
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      blockIndex?: number;
      parentBlock?: BlockElement;
    }

    interface Commands {
      getBlockIndex: typeof getBlockIndexCommand;
    }
  }
}
