import type { Command } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

function getNextSibling(std: BlockSuite.Std, blockElement: BlockElement) {
  const view = std.view;
  const next = std.doc.getNextSibling(blockElement.model);
  if (!next) return null;
  return view._blockMap.get(next.id) ?? null;
}

function getNextBlock(std: BlockSuite.Std, path: string[]) {
  const view = std.view;
  const focusBlock = view.viewFromPath('block', path);
  if (!focusBlock) return null;

  let next: BlockElement | null = null;
  if (focusBlock.childBlockElements[0]) {
    next = focusBlock.childBlockElements[0];
  }

  if (!next) {
    next = getNextSibling(std, focusBlock);
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
    path?: string[];
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
      nextBlock?: BlockElement;
    }

    interface Commands {
      getNextBlock: typeof getNextBlockCommand;
    }
  }
}
