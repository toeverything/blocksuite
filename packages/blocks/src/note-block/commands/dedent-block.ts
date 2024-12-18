import type { Command } from '@blocksuite/block-std';

import {
  calculateCollapsedSiblings,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';

/**
 * @example
 * before unindent:
 * - aaa
 *   - bbb
 *   - ccc|
 *     - ddd
 *   - eee
 *
 * after unindent:
 * - aaa
 *   - bbb
 * - ccc|
 *   - ddd
 *   - eee
 */
export const dedentBlock: Command<
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
  if (!blockId) {
    const sel = std.selection.getGroup('note').at(0);
    blockId = sel?.blockId;
  }
  if (!blockId) return;
  const model = std.doc.getBlock(blockId)?.model;
  if (!model) return;

  const parent = doc.getParent(model);
  const grandParent = parent && doc.getParent(parent);
  if (doc.readonly || !parent || parent.role !== 'content' || !grandParent) {
    // Top most, can not unindent, do nothing
    return;
  }

  if (stopCapture) doc.captureSync();

  if (
    matchFlavours(model, ['affine:paragraph']) &&
    model.type.startsWith('h') &&
    model.collapsed
  ) {
    const collapsedSiblings = calculateCollapsedSiblings(model);
    doc.moveBlocks([model, ...collapsedSiblings], grandParent, parent, false);
    return next();
  }

  try {
    const nextSiblings = doc.getNexts(model);
    doc.moveBlocks(nextSiblings, model);
    doc.moveBlocks([model], grandParent, parent, false);
  } catch {
    return;
  }

  return next();
};
