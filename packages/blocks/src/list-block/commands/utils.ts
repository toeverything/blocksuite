import type { ListBlockModel } from '@blocksuite/affine-model';
import type { BlockModel, Doc } from '@blocksuite/store';

import {
  getNextContinuousNumberedLists,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';

/**
 * correct target is a numbered list, which is divided into two steps:
 * 1. check if there is a numbered list before the target list. If so, adjust the order of the target list
 *    to the order of the previous list plus 1, otherwise set the order to 1
 * 2. find continuous lists starting from the target list and keep their order continuous
 */
export function correctNumberedListsOrderToPrev(
  doc: Doc,
  modelOrId: BlockModel | string,
  transact = true
) {
  const model =
    typeof modelOrId === 'string' ? doc.getBlock(modelOrId)?.model : modelOrId;

  if (!model) return;

  if (
    !matchFlavours(model, ['affine:list']) ||
    model.type$.value !== 'numbered'
  ) {
    return;
  }

  const fn = () => {
    // step 1
    const previousSibling = doc.getPrev(model);
    if (
      previousSibling &&
      matchFlavours(previousSibling, ['affine:list']) &&
      previousSibling.type === 'numbered'
    ) {
      if (!previousSibling.order) previousSibling.order = 1;
      model.order = previousSibling.order + 1;
    } else {
      model.order = 1;
    }

    // step 2
    let base = model.order + 1;
    const continuousNumberedLists = getNextContinuousNumberedLists(doc, model);
    continuousNumberedLists.forEach(list => {
      list.order = base;
      base++;
    });
  };

  if (transact) {
    doc.transact(fn);
  } else {
    fn();
  }
}

export function correctListOrder(doc: Doc, model: ListBlockModel) {
  // old numbered list has no order
  if (model.type === 'numbered' && !Number.isInteger(model.order)) {
    correctNumberedListsOrderToPrev(doc, model, false);
  }
  // if list is not numbered, order should be null
  if (model.type !== 'numbered') {
    model.order = null;
  }
}
