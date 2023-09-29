import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

export const deleteSelectedModelsCommand: Command<'selectedModels'> = (
  ctx,
  next
) => {
  try {
    const models = ctx.selectedModels;
    assertExists(models);

    models.forEach(model => {
      ctx.std.page.deleteBlock(model);
    });

    return next();
  } catch {
    return;
  }
};

declare global {
  namespace BlockSuite {
    interface Commands {
      deleteSelectedModels: typeof deleteSelectedModelsCommand;
    }
  }
}
