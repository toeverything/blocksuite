import type { Command } from '@blocksuite/block-std';

export const deleteSelectedModelsCommand: Command<'selectedModels'> = (
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

  models.forEach(model => {
    ctx.std.doc.deleteBlock(model);
  });

  return next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      deleteSelectedModels: typeof deleteSelectedModelsCommand;
    }
  }
}
