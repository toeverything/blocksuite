import type { Command } from '@blocksuite/block-std';
import { type BlockModel, type DraftModel, Slice } from '@blocksuite/store';

export const duplicateSelectedModelsCommand: Command<{
  draftedModels?: Promise<DraftModel<BlockModel<object>>[]>;
  selectedModels?: BlockModel[];
}> = (ctx, next) => {
  const { std, draftedModels, selectedModels } = ctx;
  if (!draftedModels || !selectedModels) return;

  const model = selectedModels[selectedModels.length - 1];

  const parentModel = std.store.getParent(model.id);
  if (!parentModel) return;

  const index = parentModel.children.findIndex(x => x.id === model.id);

  draftedModels
    .then(models => {
      const slice = Slice.fromModels(std.store, models);
      return std.clipboard.duplicateSlice(
        slice,
        std.store,
        parentModel.id,
        index + 1
      );
    })
    .catch(console.error);

  return next();
};
