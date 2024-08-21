import type { BlockStdScope } from '@blocksuite/block-std';
import type { Text } from '@blocksuite/store';

import {
  getNextContentBlock,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';

// When deleting at line end of a list block,
// check current block's children and siblings
/**
 * Example:
 - Line1  <-(cursor here)
   - Line2
     - Line3
     - Line4
   - Line5
     - Line6
 - Line7
   - Line8
 - Line9
 */
export function forwardDelete(std: BlockStdScope): true | undefined {
  const text = std.selection.find('text');
  if (!text) return;
  const isCollapsed = text.isCollapsed();
  const doc = std.doc;
  const model = doc.getBlock(text.from.blockId)?.model;
  if (!model || !matchFlavours(model, ['affine:list'])) return;
  const isEnd = isCollapsed && text.from.index === model.text.length;
  if (!isEnd) return;
  // Has children in list
  const firstChild = model.firstChild();
  if (firstChild) {
    model.text.join(firstChild.text as Text);
    const grandChildren = firstChild.children;
    if (grandChildren) {
      doc.moveBlocks(grandChildren, model);
      doc.deleteBlock(firstChild);
      return true;
    }

    doc.deleteBlock(firstChild);
    return true;
  }

  const parent = doc.getParent(model);
  // Has text sibling
  const nextSibling = doc.getNext(model);
  const nextText = nextSibling?.text;
  if (nextSibling && nextText) {
    model.text.join(nextText);
    if (nextSibling.children) {
      if (!parent) return;
      doc.moveBlocks(nextSibling.children, parent, model, false);
    }

    doc.deleteBlock(nextSibling);
    return true;
  }

  // Has next text block in other note block
  const nextBlock = getNextContentBlock(std.host, model);
  const nextBlockText = nextBlock?.text;
  if (nextBlock && nextBlockText) {
    model.text.join(nextBlock.text as Text);
    if (nextBlock.children) {
      const nextBlockParent = doc.getParent(nextBlock);
      if (!nextBlockParent) return;
      doc.moveBlocks(nextBlock.children, nextBlockParent, parent, false);
    }
    doc.deleteBlock(nextBlock);
  }
  return true;
}
