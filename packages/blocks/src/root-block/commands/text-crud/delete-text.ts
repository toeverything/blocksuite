import type { Command, TextSelection } from '@blocksuite/block-std';
import type { EditorHost } from '@blocksuite/block-std';
import type { Text } from '@blocksuite/store';

import { assertExists } from '@blocksuite/global/utils';

import { matchFlavours } from '../../../_common/utils/index.js';

export const deleteTextCommand: Command<
  'currentTextSelection',
  never,
  {
    textSelection?: TextSelection;
  }
> = (ctx, next) => {
  const textSelection = ctx.textSelection ?? ctx.currentTextSelection;
  assertExists(
    textSelection,
    '`textSelection` is required, you need to pass it in args or use `getTextSelection` command before adding this command to the pipeline.'
  );

  const host = ctx.std.host as EditorHost;
  assertExists(host.rangeManager);

  const range = host.rangeManager.textSelectionToRange(textSelection);
  if (!range) return;
  const selectedElements = host.rangeManager.getSelectedBlockComponentsByRange(
    range,
    {
      mode: 'flat',
    }
  );

  const { from, to } = textSelection;

  const fromElement = selectedElements.find(el => from.blockId === el.blockId);
  assertExists(fromElement);

  let fromText: Text | undefined;
  if (matchFlavours(fromElement.model, ['affine:page'])) {
    fromText = fromElement.model.title;
  } else {
    fromText = fromElement.model.text;
  }
  assertExists(fromText);
  if (!to) {
    fromText.delete(from.index, from.length);
    ctx.std.selection.setGroup('note', [
      ctx.std.selection.create('text', {
        from: {
          blockId: from.blockId,
          index: from.index,
          length: 0,
        },
        to: null,
      }),
    ]);
    return next();
  }

  const toElement = selectedElements.find(el => to.blockId === el.blockId);
  assertExists(toElement);

  const toText = toElement.model.text;
  assertExists(toText);

  fromText.delete(from.index, from.length);
  toText.delete(0, to.length);

  fromText.join(toText);

  selectedElements
    .filter(el => el.model.id !== fromElement.model.id)
    .forEach(el => {
      ctx.std.doc.deleteBlock(el.model);
    });

  ctx.std.selection.setGroup('note', [
    ctx.std.selection.create('text', {
      from: {
        blockId: to.blockId,
        index: to.index,
        length: 0,
      },
      to: null,
    }),
  ]);

  next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      deleteText: typeof deleteTextCommand;
    }
  }
}
