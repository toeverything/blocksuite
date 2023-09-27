import type { Command } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

export const getBlockIndexCommand: Command<
  'currentSelectionPath',
  'blockIndex' | 'parentBlock',
  {
    path?: string[];
  }
> = (ctx, next) => {
  const path = ctx.path ?? ctx.currentSelectionPath;
  assertExists(path);

  const parent = ctx.std.view.getParent(path);
  if (!parent) {
    return;
  }
  const index = parent.children.findIndex(x => {
    return PathFinder.equals(x.path, path);
  });

  next({
    blockIndex: index,
    parentBlock: parent.view as BlockElement,
  });
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      blockIndex?: number;
      parentBlock?: BlockElement;
    }

    interface Commands {
      getBlockIndex: typeof getBlockIndexCommand;
    }
  }
}
