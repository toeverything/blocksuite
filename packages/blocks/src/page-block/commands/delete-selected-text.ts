import type { Command } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

export const deleteSelectedTextCommand: Command<'selectedModels'> = (
  ctx,
  next
) => {
  try {
    const text = ctx.std.selection.find('text');
    assertExists(text);

    const { from, to } = text;

    const models = ctx.selectedModels;
    assertExists(models);

    const fromModel = models.find(
      model => PathFinder.id(from.path) === model.id
    );
    assertExists(fromModel);

    const fromText = fromModel.text;
    assertExists(fromText);
    if (!to) {
      fromText.delete(from.index, from.length);
      ctx.std.selection.setGroup('note', [
        ctx.std.selection.getInstance('text', {
          from: {
            path: from.path,
            index: from.index,
            length: 0,
          },
          to: null,
        }),
      ]);
      return next();
    }

    const toModel = models.find(model => PathFinder.id(to.path) === model.id);
    assertExists(toModel);

    const toText = toModel.text;
    assertExists(toText);

    fromText.delete(from.index, from.length);
    toText.delete(0, to.length);

    models
      .filter(model => model.id !== fromModel.id && model.id !== toModel.id)
      .forEach(model => {
        ctx.std.page.deleteBlock(model);
      });

    ctx.std.selection.setGroup('note', [
      ctx.std.selection.getInstance('text', {
        from: {
          path: to.path,
          index: to.index,
          length: 0,
        },
        to: null,
      }),
    ]);

    return next();
  } catch {
    return;
  }
};

declare global {
  namespace BlockSuite {
    interface Commands {
      deleteSelectedText: typeof deleteSelectedTextCommand;
    }
  }
}
