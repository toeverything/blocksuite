import type { BlockStdScope } from '@blocksuite/block-std';

import { EMBED_BLOCK_FLAVOUR_LIST } from '@blocksuite/affine-shared/consts';
import {
  getNextContentBlock,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';

export function forwardDelete(std: BlockStdScope) {
  const { doc, host } = std;
  const text = std.selection.find('text');
  if (!text) return;
  const isCollapsed = text.isCollapsed();
  const model = doc.getBlock(text.from.blockId)?.model;
  if (!model || !matchFlavours(model, ['affine:paragraph'])) return;
  const isEnd = isCollapsed && text.from.index === model.text.length;
  if (!isEnd) return;
  const parent = doc.getParent(model);
  if (!parent) return;

  const nextSibling = doc.getNext(model);
  const ignoreForwardDeleteFlavourList: BlockSuite.Flavour[] = [
    'affine:attachment',
    'affine:bookmark',
    // @ts-ignore TODO: should be fixed after database model is migrated to affine-models
    'affine:database',
    'affine:code',
    'affine:image',
    'affine:divider',
    ...EMBED_BLOCK_FLAVOUR_LIST,
  ];

  if (matchFlavours(nextSibling, ignoreForwardDeleteFlavourList)) {
    std.selection.setGroup('note', [
      std.selection.create('block', { blockId: nextSibling.id }),
    ]);
    return true;
  }

  if (nextSibling?.text) {
    model.text.join(nextSibling.text);
    if (nextSibling.children) {
      const parent = doc.getParent(nextSibling);
      if (!parent) return false;
      doc.moveBlocks(nextSibling.children, parent, model, false);
    }

    doc.deleteBlock(nextSibling);
    return true;
  }

  const nextBlock = getNextContentBlock(host, model);
  if (nextBlock?.text) {
    model.text.join(nextBlock.text);
    if (nextBlock.children) {
      const parent = doc.getParent(nextBlock);
      if (!parent) return false;
      doc.moveBlocks(nextBlock.children, parent, doc.getParent(model), false);
    }
    doc.deleteBlock(nextBlock);
    return true;
  }

  if (nextBlock) {
    std.selection.setGroup('note', [
      std.selection.create('block', { blockId: nextBlock.id }),
    ]);
  }
  return true;
}
