import type { Command, EditorHost } from '@blocksuite/block-std';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import {
  getNextContinuousNumberedLists,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';

import { correctNumberedListsOrderToPrev } from './utils.js';

export const splitListCommand: Command<
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

  const model = doc.getBlock(blockId)?.model;
  if (!model || !matchFlavours(model, ['affine:list'])) {
    console.error(`block ${blockId} is not a list block`);
    return;
  }
  const parent = doc.getParent(model);
  if (!parent) {
    console.error(`block ${blockId} has no parent`);
    return;
  }
  const modelIndex = parent.children.indexOf(model);
  if (modelIndex === -1) {
    console.error(`block ${blockId} is not a child of its parent`);
    return;
  }

  doc.captureSync();

  if (model.text.length === 0) {
    /**
     * case 1: target is top most, convert the list into a paragraph
     *
     * before:
     * - aaa
     * - | <- split here
     *   - bbb
     *
     * after:
     * - aaa
     * |
     *   - bbb
     */
    if (parent.role === 'hub') {
      const id = doc.addBlock('affine:paragraph', {}, parent, modelIndex);
      const paragraph = doc.getBlock(id);
      if (!paragraph) return;
      doc.deleteBlock(model, {
        bringChildrenTo: paragraph.model,
      });

      // reset next continuous numbered list's order
      const nextContinuousNumberedLists = getNextContinuousNumberedLists(
        doc,
        paragraph.model
      );
      let base = 1;
      nextContinuousNumberedLists.forEach(list => {
        doc.transact(() => {
          list.order = base;
        });
        base += 1;
      });

      host.updateComplete
        .then(() => {
          focusTextModel(std, id);
        })
        .catch(console.error);

      next();
      return;
    }

    /**
     * case 2: not top most, unindent the list
     *
     * before:
     * - aaa
     *   - bbb
     *   - | <- split here
     *   - ccc
     *
     * after:
     * - aaa
     *   - bbb
     * - |
     *   - ccc
     */
    if (parent.role === 'content') {
      host.command.exec('dedentList', {
        blockId,
        inlineIndex: 0,
      });

      next();
      return;
    }

    return;
  }

  let newListId: string | null = null;

  if (model.children.length > 0 && !model.collapsed) {
    /**
     * case 3: list has children (list not collapsed)
     *
     * before:
     * - aa|a <- split here
     *   - bbb
     *
     * after:
     * - aa
     *   - |a
     *   - bbb
     */
    const afterText = model.text.split(inlineIndex);
    newListId = doc.addBlock(
      'affine:list',
      {
        type: model.type,
        text: afterText,
        order: model.type === 'numbered' ? 1 : null,
      },
      model,
      0
    );

    if (model.type === 'numbered') {
      const nextContinuousNumberedLists = getNextContinuousNumberedLists(
        doc,
        newListId
      );
      let base = 2;
      nextContinuousNumberedLists.forEach(list => {
        doc.transact(() => {
          list.order = base;
        });
        base += 1;
      });
    }
  } else {
    /**
     * case 4: list has children (list collapsed)
     *
     * before:
     * - aa|a <- split here
     *   - bbb
     *
     * after:
     * - aa
     *   - bbb
     * - |a
     *
     *
     * case 5: list does not have children
     *
     * before:
     * - aa|a <- split here
     * - bbb
     *
     * after:
     * - aa
     * - |a
     * - bbb
     */
    const afterText = model.text.split(inlineIndex);
    newListId = doc.addBlock(
      'affine:list',
      {
        type: model.type,
        text: afterText,
        order: null,
      },
      parent,
      modelIndex + 1
    );
    correctNumberedListsOrderToPrev(doc, newListId);
  }

  if (newListId) {
    host.updateComplete
      .then(() => {
        focusTextModel(std, newListId);
      })
      .catch(console.error);

    next();
    return;
  }
};
