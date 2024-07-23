import type { Command } from '@blocksuite/block-std';
import type { BlockComponent } from '@blocksuite/block-std';

import { assertExists } from '@blocksuite/global/utils';

function getNext(std: BlockSuite.Std, block: BlockComponent) {
  const view = std.view;
  const next = std.doc.getNext(block.model);
  if (!next) return null;
  return view.getBlock(next.id);
}

function getNextBlock(std: BlockSuite.Std, path: string) {
  const view = std.view;
  const focusBlock = view.getBlock(path);
  if (!focusBlock) return null;

  let next: BlockComponent | null = null;
  if (focusBlock.childBlocks[0]) {
    next = focusBlock.childBlocks[0];
  }

  if (!next) {
    next = getNext(std, focusBlock);
  }

  if (next && !next.contains(focusBlock)) {
    return next;
  }

  return null;
}

export const getNextBlockCommand: Command<
  'currentSelectionPath',
  'nextBlock',
  {
    path?: string;
  }
> = (ctx, next) => {
  const path = ctx.path ?? ctx.currentSelectionPath;
  assertExists(
    path,
    '`path` is required, you need to pass it in args or ctx before adding this command to the pipeline.'
  );

  const nextBlock = getNextBlock(ctx.std, path);

  if (nextBlock) {
    next({ nextBlock });
  }
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      nextBlock?: BlockComponent;
    }

    interface Commands {
      getNextBlock: typeof getNextBlockCommand;
    }
  }
}
