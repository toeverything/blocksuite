import type { Command } from '@blocksuite/block-std';

import { Slice } from '@blocksuite/store';

export const duplicateSelectedModelsCommand: Command<
  'draftedModels' | 'selectedModels'
> = (ctx, next) => {
  const { std, draftedModels, selectedModels } = ctx;
  if (!draftedModels || !selectedModels) return;

  const model = selectedModels[selectedModels.length - 1];

  const parentModel = std.doc.getParent(model.id);
  if (!parentModel) return;

  const index = parentModel.children.findIndex(x => x.id === model.id);

  draftedModels
    .then(models => {
      const slice = Slice.fromModels(std.doc, models);
      return std.clipboard.duplicateSlice(
        slice,
        std.doc,
        parentModel.id,
        index + 1
      );
    })
    .catch(console.error);

  return next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      duplicateSelectedModels: typeof duplicateSelectedModelsCommand;
    }
  }
}
