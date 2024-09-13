import type { ListBlockModel } from '@blocksuite/affine-model';
import type { Command } from '@blocksuite/block-std';

import { matchFlavours } from '@blocksuite/affine-shared/utils';

/**
 * @example
 * before indent:
 * - aaa
 *   - bbb
 * - ccc|
 *   - ddd
 *   - eee
 *
 * after indent:
 * - aaa
 *   - bbb
 *   - ccc|
 *     - ddd
 *     - eee
 */
export const indentBlock: Command<
  never,
  never,
  {
    blockId?: string;
    stopCapture?: boolean;
  }
> = (ctx, next) => {
  let { blockId } = ctx;
  const { std, stopCapture = true } = ctx;
  const { doc } = std;
  const { schema } = doc;
  if (!blockId) {
    const sel = std.selection.getGroup('note').at(0);
    blockId = sel?.blockId;
  }
  if (!blockId) return;
  const model = std.doc.getBlock(blockId)?.model;
  if (!model) return;

  const previousSibling = doc.getPrev(model);
  if (
    doc.readonly ||
    !previousSibling ||
    !schema.isValid(model.flavour, previousSibling.flavour)
  ) {
    // can not indent, do nothing
    return;
  }

  if (stopCapture) doc.captureSync();
  doc.moveBlocks([model], previousSibling);

  // update collapsed state of affine list
  if (
    matchFlavours(previousSibling, ['affine:list']) &&
    previousSibling.collapsed
  ) {
    doc.updateBlock(previousSibling, {
      collapsed: false,
    } as Partial<ListBlockModel>);
  }

  return next();
};
