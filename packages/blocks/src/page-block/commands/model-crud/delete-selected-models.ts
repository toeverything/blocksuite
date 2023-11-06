import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

export const deleteSelectedModelsCommand: Command<'selectedModels'> = (
  ctx,
  next
) => {
  const models = ctx.selectedModels;
  assertExists(
    models,
    '`selectedModels` is required, you need to use `getSelectedModels` command before add this command to the pipeline.'
  );

  models.forEach(model => {
    ctx.std.page.deleteBlock(model);
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
