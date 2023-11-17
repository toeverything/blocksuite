import type { Command } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';

export const selectBlocksBetween: Command<
  'focusBlock' | 'anchorBlock',
  never,
  { tail: boolean }
> = (ctx, next) => {
  const { focusBlock, anchorBlock, tail } = ctx;
  if (!focusBlock || !anchorBlock) {
    return;
  }
  const selection = ctx.std.selection;

  // In same block
  if (PathFinder.equals(anchorBlock.path, focusBlock.path)) {
    const path = focusBlock.path;
    selection.setGroup('note', [selection.getInstance('block', { path })]);
    return next();
  }

  // In different blocks
  const selections = [...selection.value];
  if (selections.every(sel => !PathFinder.equals(sel.path, focusBlock.path))) {
    if (tail) {
      selections.push(
        selection.getInstance('block', { path: focusBlock.path })
      );
    } else {
      selections.unshift(
        selection.getInstance('block', { path: focusBlock.path })
      );
    }
  }

  let start = false;
  const sel = selections.filter(sel => {
    if (
      PathFinder.equals(sel.path, anchorBlock.path) ||
      PathFinder.equals(sel.path, focusBlock.path)
    ) {
      start = !start;
      return true;
    }
    return start;
  });

  selection.setGroup('note', sel);
  return next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      selectBlocksBetween: typeof selectBlocksBetween;
    }
  }
}
