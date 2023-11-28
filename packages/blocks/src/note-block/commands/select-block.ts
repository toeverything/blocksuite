import type { Command } from '@blocksuite/block-std';

export const selectBlock: Command<'focusBlock'> = (ctx, next) => {
  const { focusBlock, std } = ctx;
  if (!focusBlock) {
    return;
  }

  const { selection } = std;

  selection.setGroup('note', [
    selection.getInstance('block', { path: focusBlock.path }),
  ]);

  return next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      selectBlock: typeof selectBlock;
    }
  }
}
