import type { Command } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

type Filter = (view: BlockElement) => boolean;

function getPrevSibling(std: BlockSuite.Std, path: string[], filter?: Filter) {
  const view = std.view;
  const nextView = view.findPrev(path, node => {
    if (node.type !== 'block') {
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

function getLastGrandChild(std: BlockSuite.Std, blockElement: BlockElement) {
  const view = std.view;
  let output = blockElement;
  view.walkThrough((node, _index, parent) => {
    if (
      node.children.filter(n => n.type === 'block').length === 0 &&
      parent.children.filter(n => n.type === 'block').at(-1) === node
    ) {
      output = node.view as BlockElement;
      return true;
    }
    return;
  }, blockElement.path);
  return output;
}

function getPrevBlock(
  std: BlockSuite.Std,
  path: string[],
  filter?: (block: BlockElement) => boolean
) {
  const view = std.view;

  let prev: BlockElement | null = getPrevSibling(std, path, filter);

  if (!prev) {
    return null;
  }

  const block = view.viewFromPath('block', path);
  if (!block) return null;
  if (!prev.contains(block)) {
    prev = getLastGrandChild(std, prev);
  }

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
    filter?: Filter;
  }
> = (ctx, next) => {
  const path = ctx.path ?? ctx.currentSelectionPath;
  assertExists(
    path,
    '`path` is required, you need to pass it in args or ctx before adding this command to the pipeline.'
  );

  const prevBlock = getPrevBlock(ctx.std, path, ctx.filter);

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
