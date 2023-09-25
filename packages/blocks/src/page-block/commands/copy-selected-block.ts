import type { Command } from '@blocksuite/block-std';
import type { BaseBlockModel } from '@blocksuite/store';
import { Slice } from '@blocksuite/store';

export const copySelectedBlockCommand: Command<
  'selectedModels',
  never,
  { event: ClipboardEvent }
> = (ctx, next) => {
  if (!ctx.selectedModels) {
    return;
  }
  const models: BaseBlockModel[] = ctx.selectedModels.map(model =>
    model.clone()
  );
  const traverse = (model: BaseBlockModel) => {
    const children = model.children.filter(child => {
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
      copySelectedBlock: typeof copySelectedBlockCommand;
    }
  }
}
