import type { Command } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { assertExists } from '@blocksuite/global/utils';
import { type DraftModel, toDraftModel } from '@blocksuite/store';

export const draftSelectedModelsCommand: Command<
  'selectedModels',
  'draftedModels'
> = (ctx, next) => {
  const models = ctx.selectedModels;
  assertExists(
    models,
    '`selectedModels` is required, you need to use `getSelectedModels` command before adding this command to the pipeline.'
  );

  const draftedModels = models.map(toDraftModel);

  const traverse = (model: DraftModel) => {
    const isDatabase = model.flavour === 'affine:database';
    const children = isDatabase
      ? model.children
      : model.children.filter(child => {
          const idx = draftedModels.findIndex(m => m.id === child.id);
          return idx >= 0;
        });

    children.forEach(child => {
      const idx = draftedModels.findIndex(m => m.id === child.id);
      if (idx >= 0) {
        draftedModels.splice(idx, 1);
      }
      traverse(child);
    });
    model.children = children;
  };

  draftedModels.forEach(traverse);

  return next({ draftedModels });
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      draftedModels?: DraftModel<BlockModel<object>>[];
    }

    interface Commands {
      draftSelectedModels: typeof draftSelectedModelsCommand;
    }
  }
}
