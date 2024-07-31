import type { Command, EditorHost } from '@blocksuite/block-std';

import { matchFlavours } from '../../_common/utils/model.js';
import { correctNumberedListsOrderToPrev } from './utils.js';

export const indentListCommand: Command<
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
   * - ccc <- indent
   *   - ddd
   * - eee
   *
   * final state:
   * - aaa
   *   - bbb
   *   - ccc
   *     - ddd
   * - eee
   */

  /**
   * ccc
   */
  const model = doc.getBlock(blockId).model;
  if (!matchFlavours(model, ['affine:list'])) {
    console.error(`block ${blockId} is not a list block`);
    return;
  }
  /**
   * aaa
   */
  const previousSibling = doc.getPrev(model);
  if (!previousSibling) {
    // cannot indent, do nothing
    return;
  }
  /**
   * eee
   */
  const nextSibling = doc.getNext(model);

  doc.captureSync();

  doc.moveBlocks([model], previousSibling);
  correctNumberedListsOrderToPrev(doc, model);
  if (nextSibling) correctNumberedListsOrderToPrev(doc, nextSibling);

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
      indentList: typeof indentListCommand;
    }
  }
}
