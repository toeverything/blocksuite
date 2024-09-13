import type { Command } from '@blocksuite/block-std';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import { matchFlavours } from '@blocksuite/affine-shared/utils';

export const listToParagraphCommand: Command<
  never,
  'listConvertedId',
  {
    id: string;
    stopCapturing?: boolean;
  }
> = (ctx, next) => {
  const { id, stopCapturing = true } = ctx;
  const std = ctx.std;
  const doc = std.doc;
  const model = doc.getBlock(id)?.model;

  if (!model || !matchFlavours(model, ['affine:list'])) return false;

  const parent = doc.getParent(model);
  if (!parent) return false;

  const index = parent.children.indexOf(model);
  const blockProps = {
    type: 'text' as const,
    text: model.text?.clone(),
    children: model.children,
  };
  if (stopCapturing) std.doc.captureSync();
  doc.deleteBlock(model, {
    deleteChildren: false,
  });

  const listConvertedId = doc.addBlock(
    'affine:paragraph',
    blockProps,
    parent,
    index
  );
  focusTextModel(std, listConvertedId);
  return next({ listConvertedId });
};
