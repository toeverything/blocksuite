import type { Command } from '@blocksuite/block-std';

export const focusBlockStart: Command<'focusBlock'> = (ctx, next) => {
  const { focusBlock, std } = ctx;
  if (!focusBlock || !focusBlock.model.text) return;

  const { selection } = std;

  selection.setGroup('note', [
    selection.create('text', {
      from: { path: focusBlock.path, index: 0, length: 0 },
      to: null,
    }),
  ]);

  return next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      focusBlockStart: typeof focusBlockStart;
    }
  }
}
