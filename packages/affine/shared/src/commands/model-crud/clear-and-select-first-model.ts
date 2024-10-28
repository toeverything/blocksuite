import type { Command } from '@blocksuite/block-std';

export const clearAndSelectFirstModelCommand: Command<'selectedModels'> = (
  ctx,
  next
) => {
  const models = ctx.selectedModels;

  if (!models) {
    console.error(
      '`selectedModels` is required, you need to use `getSelectedModels` command before adding this command to the pipeline.'
    );
    return;
  }

  if (models.length > 0) {
    const firstModel = models[0];
    if (firstModel.text) {
      firstModel.text.clear();
      const selection = ctx.std.selection.create('text', {
        from: {
          blockId: firstModel.id,
          index: 0,
          length: 0,
        },
        to: null,
      });
      ctx.std.selection.setGroup('note', [selection]);
    }
  }

  return next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      clearAndSelectFirstModel: typeof clearAndSelectFirstModelCommand;
    }
  }
}
