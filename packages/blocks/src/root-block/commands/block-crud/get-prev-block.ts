import type { Command } from '@blocksuite/block-std';
import type { BlockComponent } from '@blocksuite/block-std';

import { assertExists } from '@blocksuite/global/utils';

function getPrevSibling(std: BlockSuite.Std, path: string) {
  const view = std.view;
  const block = view.getBlock(path);
  if (!block) return null;
  const prev = std.doc.getPrev(block.model);
  if (!prev) return null;
  return view.getBlock(prev.id);
}

function getPrevBlock(std: BlockSuite.Std, path: string) {
  const view = std.view;

  const prev: BlockComponent | null = getPrevSibling(std, path);

  if (!prev) {
    return null;
  }

  const block = view.getBlock(path);
  if (!block) return null;

  if (prev && prev.blockId !== path) {
    return prev;
  }

  return null;
}

export const getPrevBlockCommand: Command<
  'currentSelectionPath',
  'prevBlock',
  {
    path?: string;
  }
> = (ctx, next) => {
  const path = ctx.path ?? ctx.currentSelectionPath;
  assertExists(
    path,
    '`path` is required, you need to pass it in args or ctx before adding this command to the pipeline.'
  );

  const prevBlock = getPrevBlock(ctx.std, path);

  if (prevBlock) {
    next({ prevBlock });
  }
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      prevBlock?: BlockComponent;
    }

    interface Commands {
      getPrevBlock: typeof getPrevBlockCommand;
    }
  }
}
