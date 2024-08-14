import type { Command, EditorHost } from '@blocksuite/block-std';

import { matchFlavours } from '@blocksuite/affine-shared/utils';

import { correctNumberedListsOrderToPrev } from './utils.js';

export const unindentListCommand: Command<
  never,
  never,
  {
    blockId: string;
    inlineIndex: number;
  }
> = (ctx, next) => {
  const { blockId, inlineIndex, std } = ctx;
  const host = std.host as EditorHost;
  const doc = host.doc;

  /**
   * initial state:
   * - aaa
   *   - bbb
   *     - ccc  <- unindent
   *       - ddd
   *     - eee
   *   - fff
   *
   * final state:
   * - aaa
   *   - bbb
   *   - ccc
   *     - ddd
   *     - eee
   *   - fff
   */

  /**
   * ccc
   */
  const model = doc.getBlock(blockId)?.model;
  if (!model || !matchFlavours(model, ['affine:list'])) {
    console.error(`block ${blockId} is not a list block`);
    return;
  }
  /**
   * bbb
   */
  const parent = doc.getParent(model);
  if (!parent) {
    console.error(`block ${blockId} has no parent`);
    return;
  }
  if (parent.role !== 'content') {
    // Top most list cannot be unindent
    return;
  }
  /**
   * aaa
   */
  const grandParent = doc.getParent(parent);
  if (!grandParent) {
    console.error(`block ${blockId} has no grand parent`);
    return;
  }
  /**
   * ccc index
   */
  const modelIndex = parent.children.indexOf(model);
  if (modelIndex === -1) {
    console.error(`block ${blockId} is not a child of its parent`);
    return;
  }

  doc.captureSync();

  /**
   * step 1:
   * - aaa
   *   - bbb
   *     - ccc
   *       - ddd
   *       - eee <- make eee as ccc's child
   *   - fff
   */
  const nextSiblings = doc.getNexts(model); // [eee]
  doc.moveBlocks(nextSiblings, model);
  /**
   * eee
   */
  const nextSibling = nextSiblings.at(0);
  if (nextSibling) correctNumberedListsOrderToPrev(doc, nextSibling);

  /**
   * step 2:
   * - aaa
   *   - bbb
   *   - ccc <- make ccc as aaa's child
   *     - ddd
   *     - eee
   *   - fff
   */
  doc.moveBlocks([model], grandParent, parent, false);
  correctNumberedListsOrderToPrev(doc, model);

  host.updateComplete
    .then(() => {
      host.selection.setGroup('note', [
        host.selection.create('text', {
          from: {
            blockId,
            index: inlineIndex,
            length: 0,
          },
          to: null,
        }),
      ]);
    })
    .catch(console.error);

  next();
};

declare global {
  namespace BlockSuite {
    interface Commands {
      unindentList: typeof unindentListCommand;
    }
  }
}
