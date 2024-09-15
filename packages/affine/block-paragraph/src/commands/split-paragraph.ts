import type { Command } from '@blocksuite/block-std';

import {
  focusTextModel,
  getInlineEditorByModel,
} from '@blocksuite/affine-components/rich-text';
import { matchFlavours } from '@blocksuite/affine-shared/utils';

export const splitParagraphCommand: Command<
  never,
  'paragraphConvertedId',
  {
    blockId?: string;
  }
> = (ctx, next) => {
  const { std } = ctx;
  const { doc, host, selection } = std;
  let blockId = ctx.blockId;
  if (!blockId) {
    const text = selection.find('text');
    blockId = text?.blockId;
  }
  if (!blockId) return;

  const model = doc.getBlock(blockId)?.model;
  if (!model || !matchFlavours(model, ['affine:paragraph'])) return;

  const inlineEditor = getInlineEditorByModel(host, model);
  const range = inlineEditor?.getInlineRange();
  if (!range) return;

  const splitIndex = range.index;
  const splitLength = range.length;
  // On press enter, it may convert symbols from yjs ContentString
  // to yjs ContentFormat. Once it happens, the converted symbol will
  // be deleted and not counted as model.text.yText.length.
  // Example: "`a`[enter]" -> yText[<ContentFormat: Code>, "a", <ContentFormat: Code>]
  // In this case, we should not split the block.
  if (model.text.yText.length < splitIndex + splitLength) return;

  if (model.children.length > 0 && splitIndex > 0) {
    doc.captureSync();
    const right = model.text.split(splitIndex, splitLength);
    const id = doc.addBlock(
      model.flavour as BlockSuite.Flavour,
      {
        text: right,
        type: model.type,
      },
      model,
      0
    );
    focusTextModel(std, id);
    return next({ paragraphConvertedId: id });
  }

  const parent = doc.getParent(model);
  if (!parent) return;
  const index = parent.children.indexOf(model);
  if (index < 0) return;
  doc.captureSync();
  const right = model.text.split(splitIndex, splitLength);
  const id = doc.addBlock(
    model.flavour,
    {
      text: right,
      type: model.type,
    },
    parent,
    index + 1
  );
  const newModel = doc.getBlock(id)?.model;
  if (newModel) {
    doc.moveBlocks(model.children, newModel);
  } else {
    console.error('Failed to find the new model split from the paragraph');
  }
  focusTextModel(std, id);
  return next({ paragraphConvertedId: id });
};
