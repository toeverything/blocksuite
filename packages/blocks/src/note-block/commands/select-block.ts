import type { Command } from '@blocksuite/block-std';

export const selectBlock: Command<'focusBlock'> = (ctx, next) => {
  const { focusBlock, std } = ctx;
  if (!focusBlock) {
    return;
  }

  const { selection } = std;

  selection.setGroup('note', [
    selection.create('block', { blockId: focusBlock.blockId }),
  ]);

  return next();
};
