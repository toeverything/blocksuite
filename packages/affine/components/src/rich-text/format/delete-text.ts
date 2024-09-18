import type { Command, TextSelection } from '@blocksuite/block-std';
import type { Text } from '@blocksuite/store';

import { matchFlavours } from '@blocksuite/affine-shared/utils';

export const deleteTextCommand: Command<
  'currentTextSelection',
  never,
  {
    textSelection?: TextSelection;
  }
> = (ctx, next) => {
  const textSelection = ctx.textSelection ?? ctx.currentTextSelection;
  if (!textSelection) return;

  const range = ctx.std.range.textSelectionToRange(textSelection);
  if (!range) return;
  const selectedElements = ctx.std.range.getSelectedBlockComponentsByRange(
    range,
    {
      mode: 'flat',
    }
  );

  const { from, to } = textSelection;

  const fromElement = selectedElements.find(el => from.blockId === el.blockId);
  if (!fromElement) return;

  let fromText: Text | undefined;
  if (matchFlavours(fromElement.model, ['affine:page'])) {
    fromText = fromElement.model.title;
  } else {
    fromText = fromElement.model.text;
  }
  if (!fromText) return;
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
  if (!toElement) return;

  const toText = toElement.model.text;
  if (!toText) return;

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
