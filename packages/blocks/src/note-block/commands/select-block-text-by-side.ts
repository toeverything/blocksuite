import type { Command } from '@blocksuite/block-std';

export const selectBlockTextBySide: Command<
  'focusBlock',
  never,
  { tail: boolean }
> = (ctx, next) => {
  const { focusBlock, tail } = ctx;
  if (!focusBlock) {
    return;
  }
  const path = focusBlock.path;
  const { selection } = ctx.std;

  selection.setGroup('note', [
    selection.create('text', {
      from: {
        path,
        index: tail ? focusBlock.model.text?.length ?? 0 : 0,
        length: 0,
      },
      to: null,
    }),
  ]);
  return next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      selectBlockTextBySide: typeof selectBlockTextBySide;
    }
  }
}
