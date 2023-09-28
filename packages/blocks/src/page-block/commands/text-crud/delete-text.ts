import type { Command, TextSelection } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

export const deleteTextCommand: Command<
  'currentTextSelection' | 'root',
  never,
  {
    textSelection?: TextSelection;
  }
> = (ctx, next) => {
  try {
    const textSelection = ctx.textSelection ?? ctx.currentTextSelection;
    assertExists(textSelection);
    const root = ctx.root;
    assertExists(root);
    assertExists(root.rangeManager);

    const range = root.rangeManager.textSelectionToRange(textSelection);
    if (!range) return;
    const selectedElements = root.rangeManager.getSelectedBlockElementsByRange(
      range,
      {
        mode: 'flat',
      }
    );

    const { from, to } = textSelection;

    const fromElement = selectedElements.find(
      el => PathFinder.id(from.path) === el.id
    );
    assertExists(fromElement);

    const fromText = fromElement.model.text;
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

    const toElement = selectedElements.find(
      el => PathFinder.id(to.path) === el.id
    );
    assertExists(toElement);

    const toText = toElement.model.text;
    assertExists(toText);

    fromText.delete(from.index, from.length);
    toText.delete(0, to.length);

    selectedElements
      .filter(el => el.id !== fromElement.id && el.id !== toElement.id)
      .forEach(el => {
        ctx.std.page.deleteBlock(el.model);
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

    next();
  } catch {
    return;
  }
};

declare global {
  namespace BlockSuite {
    interface Commands {
      deleteText: typeof deleteTextCommand;
    }
  }
}
