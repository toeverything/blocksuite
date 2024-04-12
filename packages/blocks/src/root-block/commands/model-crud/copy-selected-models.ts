import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { type DraftModel, toDraftModel } from '@blocksuite/store';
import { Slice } from '@blocksuite/store';

export const copySelectedModelsCommand: Command<'selectedModels' | 'onCopy'> = (
  ctx,
  next
) => {
  const models = ctx.selectedModels;
  console.log('selected models: ', models);
  assertExists(
    models,
    '`selectedModels` is required, you need to use `getSelectedModels` command before adding this command to the pipeline.'
  );

  const drafts = models.map(toDraftModel);

  const traverse = (model: DraftModel) => {
    const isDatabase = model.flavour === 'affine:database';
    const children = isDatabase
      ? model.children
      : model.children.filter(child => {
          const idx = drafts.findIndex(m => m.id === child.id);
          return idx >= 0;
        });

    children.forEach(child => {
      const idx = drafts.findIndex(m => m.id === child.id);
      if (idx >= 0) {
        drafts.splice(idx, 1);
      }
      traverse(child);
    });
    model.children = children;
  };
  drafts.forEach(traverse);

  console.log('draft models: ', drafts);
  const slice = Slice.fromModels(ctx.std.doc, drafts);

  ctx.std.clipboard
    .copy(slice)
    .then(() => ctx.onCopy?.())
    .catch(console.error);
  return next();
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      onCopy?: () => void;
    }
    interface Commands {
      copySelectedModels: typeof copySelectedModelsCommand;
    }
  }
}
