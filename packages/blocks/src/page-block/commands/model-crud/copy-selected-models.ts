import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import { Slice } from '@blocksuite/store';

import { matchFlavours } from '../../../_common/utils/index.js';

export const copySelectedModelsCommand: Command<
  'selectedModels',
  never,
  { event: ClipboardEvent }
> = (ctx, next) => {
  const selectedModels = ctx.selectedModels;
  assertExists(
    selectedModels,
    '`selectedModels` is required, you need to use `getSelectedModels` command before adding this command to the pipeline.'
  );

  const models: BaseBlockModel[] = selectedModels.map(model => model.clone());
  const traverse = (model: BaseBlockModel) => {
    const isDatabase = matchFlavours(model, ['affine:database']);
    const children = isDatabase
      ? model.children
      : model.children.filter(child => {
          const idx = models.findIndex(m => m.id === child.id);
          if (idx < 0) {
            model.childMap.delete(child.id);
          }
          return idx >= 0;
        });

    children.forEach(child => {
      const idx = models.findIndex(m => m.id === child.id);
      if (idx >= 0) {
        models.splice(idx, 1);
      }
      traverse(child);
    });
    model.children = children;
    return;
  };
  models.forEach(traverse);

  const slice = Slice.fromModels(ctx.std.page, models);
  ctx.std.clipboard.copy(ctx.event, slice);
  return next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      copySelectedModels: typeof copySelectedModelsCommand;
    }
  }
}
