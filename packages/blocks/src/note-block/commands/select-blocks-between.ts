import type { Command } from '@blocksuite/block-std';

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
  if (anchorBlock.blockId === focusBlock.blockId) {
    const blockId = focusBlock.blockId;
    selection.setGroup('note', [selection.create('block', { blockId })]);
    return next();
  }

  // In different blocks
  const selections = [...selection.value];
  if (selections.every(sel => sel.blockId !== focusBlock.blockId)) {
    if (tail) {
      selections.push(
        selection.create('block', { blockId: focusBlock.blockId })
      );
    } else {
      selections.unshift(
        selection.create('block', { blockId: focusBlock.blockId })
      );
    }
  }

  let start = false;
  const sel = selections.filter(sel => {
    if (
      sel.blockId === anchorBlock.blockId ||
      sel.blockId === focusBlock.blockId
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
