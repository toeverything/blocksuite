import type { Command, EditorHost } from '@blocksuite/block-std';

import { matchFlavours } from '@blocksuite/affine-shared/utils';

import { getNextContinuousNumberedLists } from './utils.js';

export const convertToNumberedListCommand: Command<
  never,
  'listConvertedId',
  {
    id: string;
    order: number; // This parameter may not correspond to the final order.
    stopCapturing?: boolean;
  }
> = (ctx, next) => {
  const { std, id, order, stopCapturing = true } = ctx;
  const host = std.host as EditorHost;
  const doc = host.doc;

  if (stopCapturing) host.doc.captureSync();

  const model = doc.getBlock(id)?.model;
  if (!model || !model.text) return;
  const parent = doc.getParent(model);
  if (!parent) return;
  const index = parent.children.indexOf(model);
  const prevSibling = doc.getPrev(model);
  let realOrder = order;

  // if there is a numbered list before, the order continues from the previous list
  if (
    prevSibling &&
    matchFlavours(prevSibling, ['affine:list']) &&
    prevSibling.type === 'numbered'
  ) {
    doc.transact(() => {
      if (!prevSibling.order) prevSibling.order = 1;
      realOrder = prevSibling.order + 1;
    });
  }

  // add a new list block and delete the current block
  const newListId = doc.addBlock(
    'affine:list',
    {
      type: 'numbered',
      text: model.text.clone(),
      order: realOrder,
    },
    parent,
    index
  );
  const newList = doc.getBlock(newListId)?.model;
  if (!newList) {
    return;
  }

  doc.deleteBlock(model, {
    deleteChildren: false,
    bringChildrenTo: newList,
  });

  // if there is a numbered list following, correct their order to keep them continuous
  const nextContinuousNumberedLists = getNextContinuousNumberedLists(
    doc,
    newList
  );
  let base = realOrder + 1;
  nextContinuousNumberedLists.forEach(list => {
    doc.transact(() => {
      list.order = base;
    });
    base += 1;
  });

  return next({ listConvertedId: newList.id });
};

declare global {
  namespace BlockSuite {
    interface Commands {
      convertToNumberedList: typeof convertToNumberedListCommand;
    }
  }
}
