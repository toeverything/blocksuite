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
    ctx.std.doc.transact(() => {
      const firstModel = models[0];
      firstModel.text?.clear();
    });
    ctx.std.selection.clear();
    ctx.std.selection.setGroup('note', [
      ctx.std.selection.create('text', {
        from: { blockId: models[0].id, index: 0, length: 0 },
        to: null,
      }),
    ]);
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
