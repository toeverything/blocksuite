import type { Command } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';

export const getBlockIndexCommand: Command<
  never,
  'blockIndex' | 'parentBlock'
> = (ctx, next) => {
  const sel = ctx.std.selection.getGroup('note').at(0);
  if (!sel) {
    return;
  }
  const parent = ctx.std.view.getParent(sel.path);
  if (!parent) {
    return;
  }
  const index = parent.children.findIndex(x => {
    return PathFinder.equals(x.path, sel.path);
  });

  return next({
    blockIndex: index,
    parentBlock: parent.view as BlockElement,
  });
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      blockIndex: number;
      parentBlock: BlockElement;
    }

    interface Commands {
      getBlockIndex: typeof getBlockIndexCommand;
    }
  }
}
