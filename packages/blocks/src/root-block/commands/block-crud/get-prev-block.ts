import type { Command } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

function getPrevSibling(std: BlockSuite.Std, path: string[]) {
  const view = std.view;
  const blockElement = view.fromPath(path);
  if (!blockElement) return null;
  const prev = std.doc.getPreviousSibling(blockElement.model);
  if (!prev) return null;
  return view._blockMap.get(prev.id) ?? null;
}

function getPrevBlock(std: BlockSuite.Std, path: string[]) {
  const view = std.view;

  const prev: BlockElement | null = getPrevSibling(std, path);

  if (!prev) {
    return null;
  }

  const block = view.viewFromPath('block', path);
  if (!block) return null;

  if (prev && !PathFinder.equals(prev.path, path)) {
    return prev;
  }

  return null;
}

export const getPrevBlockCommand: Command<
  'currentSelectionPath',
  'prevBlock',
  {
    path?: string[];
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
      prevBlock?: BlockElement;
    }

    interface Commands {
      getPrevBlock: typeof getPrevBlockCommand;
    }
  }
}
