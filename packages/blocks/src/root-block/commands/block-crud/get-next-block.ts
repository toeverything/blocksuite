import type { Command } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

type Filter = (view: BlockElement) => boolean;

function getNextSibling(
  std: BlockSuite.Std,
  blockElement: BlockElement,
  filter?: Filter
) {
  const view = std.view;
  const nextView = view.findNext(blockElement.path, node => {
    if (node.type !== 'block' || node.view.contains(blockElement)) {
      return;
    }
    if (filter && !filter(node.view as BlockElement)) {
      return;
    }
    return true;
  });
  if (!nextView) return null;
  return view.viewFromPath('block', nextView.path);
}

function getNextBlock(
  std: BlockSuite.Std,
  path: string[],
  filter?: (block: BlockElement) => boolean
) {
  const view = std.view;
  const focusBlock = view.viewFromPath('block', path);
  if (!focusBlock) return null;

  let next: BlockElement | null = null;
  if (focusBlock.childBlockElements[0]) {
    next = focusBlock.childBlockElements[0];
  }

  if (!next) {
    next = getNextSibling(std, focusBlock, filter);
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
    filter?: Filter;
  }
> = (ctx, next) => {
  const path = ctx.path ?? ctx.currentSelectionPath;
  assertExists(
    path,
    '`path` is required, you need to pass it in args or ctx before adding this command to the pipeline.'
  );

  const nextBlock = getNextBlock(ctx.std, path, ctx.filter);

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
